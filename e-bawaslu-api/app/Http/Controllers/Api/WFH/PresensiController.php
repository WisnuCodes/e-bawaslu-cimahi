<?php

namespace App\Http\Controllers\Api\WFH;

use App\Http\Controllers\Controller;
use App\Models\Presensi;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use App\Services\HolidayService;

class PresensiController extends Controller
{
    protected $holidayService;

    public function __construct(HolidayService $holidayService)
    {
        $this->holidayService = $holidayService;
    }

    public function statusHariIni(Request $request)
    {
        $now = Carbon::now();
        $tipe = $this->holidayService->getJadwalType($now);
        $keterangan = $this->holidayService->getHolidayInfo($now);
        
        return response()->json([
            'tipe_kehadiran' => $tipe,
            'is_holiday' => $tipe === 'Libur',
            'keterangan_libur' => $keterangan
        ]);
    }

    private function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // km
        
        $lat1 = deg2rad((float)$lat1);
        $lon1 = deg2rad((float)$lon1);
        $lat2 = deg2rad((float)$lat2);
        $lon2 = deg2rad((float)$lon2);
        
        $latDelta = $lat2 - $lat1;
        $lonDelta = $lon2 - $lon1;
        
        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($lat1) * cos($lat2) * pow(sin($lonDelta / 2), 2)));
            
        return $angle * $earthRadius;
    }
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Presensi::query()
            ->join('users', 'presensi_wfh.user_id', '=', 'users.user_id')
            ->select('presensi_wfh.*', 'users.username as nama_pegawai')
            ->orderBy('timestamp_checkin', 'desc');

        $role = strtolower($user->role);
        $isAdmin = str_contains($role, 'admin') || str_contains($role, 'superadmin');
        $isKetua = str_contains($role, 'ketua');
        $isSekretaris = str_contains($role, 'sekretaris') || str_contains($role, 'koordinator sekretariat');
        $isSDMO = str_contains($role, 'sdmo');

        $canManageOther = $isAdmin || $isKetua || $isSekretaris || $isSDMO;

        // Tampilkan semua untuk admin, ketua, sekretaris, dan SDMO. Jika staf/kordiv lain, hanya miliknya sendiri.
        if (!$canManageOther) {
            $query->where('presensi_wfh.user_id', $user->user_id);
        }

        // Filter berdasarkan start_date dan end_date (jika tidak ada, ambil hari ini)
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            $query->whereBetween('timestamp_checkin', [$startDate, $endDate]);
        } else {
            $today = Carbon::today();
            $query->whereDate('timestamp_checkin', $today);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
            'today' => Presensi::where('user_id', $user->user_id)
                ->whereDate('timestamp_checkin', Carbon::today())->first()
        ], 200);
    }
    public function update(Request $request, $id)
    {
        $presensi = Presensi::findOrFail($id);

        $user = $request->user();
        $role = strtolower($user->role);
        $isAdmin = str_contains($role, 'admin') || str_contains($role, 'superadmin') || str_contains($role, 'ketua');

        // Yang bisa edit: user itu sendiri (untuk absennya) ATAU Admin/Ketua (untuk semua orang)
        if ($presensi->user_id !== $user->user_id && !$isAdmin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Hanya Admin/Ketua yang dapat mengedit presensi user lain.'], 403);
        }

        $presensi = Presensi::findOrFail($id);

        $request->validate([
            'status_ci' => 'sometimes|string',
            'status_co' => 'sometimes|string'
        ]);

        if ($request->has('status_ci')) {
            $presensi->status_ci = $request->status_ci;
        }
        if ($request->has('status_co')) {
            $presensi->status_co = $request->status_co;
        }

        // Use mass assignment or individual assignment
        // save() since it's an existing model
        $presensi->save();

        return response()->json([
            'success' => true,
            'message' => 'Presensi berhasil diperbarui',
            'data' => $presensi
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $presensi = Presensi::findOrFail($id);

        $user = $request->user();
        $role = strtolower($user->role);
        $isAdmin = str_contains($role, 'admin');
        $isPimpinan = str_contains($role, 'ketua') || str_contains($role, 'pimpinan') || str_contains($role, 'koordinator sekretariat');
        $isKadiv = str_contains($role, 'kordiv') || str_contains($role, 'kepala divisi') || str_contains($role, 'kasubag') || str_contains($role, 'kabag');
        $canManageOther = $isAdmin || $isPimpinan || $isKadiv;

        if ($presensi->user_id !== $user->user_id && !$canManageOther) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        $presensi->delete();

        return response()->json([
            'success' => true,
            'message' => 'Presensi berhasil dihapus'
        ], 200);
    }

    public function checkIn(Request $request)
    {
        $request->validate([
            'selfie_image' => 'required|file|mimes:jpeg,png,jpg',
            'gps_koordinat' => ['required', new \App\Rules\Coordinates],
            'liveness_score' => 'required|numeric'
        ]);

        if ($request->liveness_score < 0.8) {
            return response()->json([
                'success' => false,
                'message' => 'Presensi ditolak. Sistem mendeteksi kemungkinan foto cetak atau layar perangkat (Spoofing).'
            ], 403);
        }

        $user = $request->user();
        $userId = $user->user_id;
        $now = Carbon::now();
        $todayDate = $now->format('Y-m-d');

        $tipeJadwal = $this->holidayService->getJadwalType($now);
        $isWfhDay = ($tipeJadwal === 'WFH');
        
        $tipeKehadiran = $tipeJadwal;
        if ($tipeJadwal === 'Libur') {
            $tipeKehadiran = 'Lembur Libur';
        }

        if (Presensi::where('user_id', $userId)->whereDate('timestamp_checkin', $todayDate)->exists()) {
            return response()->json(['message' => 'Anda sudah memiliki catatan presensi atau izin hari ini.'], 422);
        }

        // Validasi Koordinat dan Geofence
        $current = explode(',', $request->gps_koordinat);
        $role = strtolower($user->role);
        $isFieldSupervisor = str_contains($role, 'pkd') || str_contains($role, 'panwascam') || str_contains($role, 'pengawas tps') || str_contains($role, 'ptps');

        if ($isFieldSupervisor) {
            if (!$user->koordinat_acuan) {
                return response()->json(['message' => 'Koordinat acuan belum disetting.', 'errors' => ['gps_koordinat' => ['Koordinat acuan tidak ditemukan.']]], 422);
            }
            $acuan = explode(',', $user->koordinat_acuan);
            if (count($acuan) == 2 && count($current) == 2) {
                $distance = $this->calculateDistance($acuan[0], $acuan[1], $current[0], $current[1]);
                if ($distance > 1.0) { // 1 km = 1000 meters
                    return response()->json([
                        'success' => false,
                        'message' => 'Presensi ditolak. Anda berada di luar radius penugasan.'
                    ], 403);
                }
            }
        } else {
            // Radius 500 meter dari Kantor Bawaslu
            $acuan = [-6.871635322140859, 107.54447933887951];
            
            if (!$isWfhDay && $tipeJadwal !== 'Libur' && count($current) == 2) {
                $distance = $this->calculateDistance($acuan[0], $acuan[1], $current[0], $current[1]);
                if ($distance > 10.0) { // Toleransi 10 km untuk PC/Laptop
                    return response()->json([
                        'success' => false,
                        'message' => 'Presensi ditolak. Hari ini adalah hari WFO dan Anda berada di luar radius dari Kantor Bawaslu. (Lokasi terdeteksi berjarak ' . round($distance * 1000) . ' meter. Titik Anda: ' . implode(',', $current) . ')'
                    ], 403);
                }
            }
        }

        $path = $request->file('selfie_image')->store('presensi', 'public');

        // Validasi jam kerja CI
        $status_ci = 'Hadir';
        $jamBatas = Carbon::parse($now->format('Y-m-d') . ' 08:30:00');
        if ($now->greaterThan($jamBatas)) {
            $status_ci = 'Terlambat';
        }

        $presensi = Presensi::create([
            'presensi_id' => (string) Str::uuid(),
            'user_id' => $userId,
            'timestamp_checkin' => $now,
            'selfie_masuk_url' => $path,
            'status_ci' => $status_ci,
            'tipe_kehadiran' => $tipeKehadiran,
            'gps_koordinat' => $request->gps_koordinat,
            'liveness_score' => $request->liveness_score
        ]);

        // Mock send notification
        Log::info("NOTIFIKASI: Foto presensi check-in berhasil diunggah oleh user: " . $user->username);

        return response()->json([
            'success' => true,
            'message' => 'Check-in berhasil tercatat.',
            'data' => $presensi
        ], 201);
    }

    public function submitIzin(Request $request)
    {
        $validated = $request->validate([
            'jenis_izin' => 'required|in:Sakit,Izin',
            'keterangan_izin' => 'required|string|max:2000',
            'file_lampiran' => 'required|file|mimes:pdf,jpeg,png,jpg|max:2048',
        ]);

        $path = null;
        try {
            $presensi = DB::transaction(function () use ($request, $validated, &$path) {
                $user = $request->user();
                // Serialize submissions for the same employee before checking today's record.
                DB::table('users')->where('user_id', $user->user_id)->lockForUpdate()->first();
                $now = Carbon::now();
                if (Presensi::where('user_id', $user->user_id)->whereDate('timestamp_checkin', $now->toDateString())->exists()) {
                    throw ValidationException::withMessages([
                        'jenis_izin' => 'Anda sudah memiliki catatan presensi atau izin hari ini.',
                    ]);
                }

                $path = $request->file('file_lampiran')->store('izin', 'public');
                if (!$path) {
                    throw new \RuntimeException('Lampiran izin gagal disimpan.');
                }
                return Presensi::create([
                    'presensi_id' => (string) Str::uuid(),
                    'user_id' => $user->user_id,
                    'timestamp_checkin' => $now,
                    'lampiran_izin' => $path,
                    'status_ci' => $validated['jenis_izin'],
                    'status_co' => $validated['jenis_izin'],
                    'tipe_kehadiran' => $validated['jenis_izin'],
                    'keterangan_izin' => trim($validated['keterangan_izin']),
                ]);
            });
        } catch (\Throwable $exception) {
            if ($path) Storage::disk('public')->delete($path);
            throw $exception;
        }

        return response()->json([
            'success' => true,
            'message' => "Pengajuan {$validated['jenis_izin']} berhasil dicatat untuk hari ini.",
            'data' => $presensi,
        ], 201);
    }

    public function checkOut(Request $request)
    {
        $request->validate([
            'presensi_id' => 'required|uuid',
            'selfie_image' => 'required|file|mimes:jpeg,png,jpg',
            'gps_koordinat' => ['required', new \App\Rules\Coordinates],
            'liveness_score' => 'required|numeric'
        ]);

        if ($request->liveness_score < 0.8) {
            return response()->json([
                'success' => false,
                'message' => 'Check-out ditolak. Liveness detection gagal.'
            ], 403);
        }

        $presensi = Presensi::findOrFail($request->presensi_id);

        $user = $request->user();

        if ($presensi->user_id !== $user->user_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if (in_array($presensi->status_ci, ['Sakit', 'Izin', 'Cuti'])) {
            return response()->json(['message' => 'Catatan sakit/izin tidak memerlukan check-out.'], 422);
        }

        $now = Carbon::now();
        $todayDate = $now->format('Y-m-d');

        $tipeJadwal = $this->holidayService->getJadwalType($now);
        $isWfhDay = ($tipeJadwal === 'WFH');

        // Validasi Koordinat dan Geofence
        $current = explode(',', $request->gps_koordinat);
        $role = strtolower($user->role);
        $isFieldSupervisor = str_contains($role, 'pkd') || str_contains($role, 'panwascam') || str_contains($role, 'pengawas tps') || str_contains($role, 'ptps');

        if ($isFieldSupervisor) {
            if (!$user->koordinat_acuan) {
                return response()->json(['message' => 'Koordinat acuan belum disetting.', 'errors' => ['gps_koordinat' => ['Koordinat acuan tidak ditemukan.']]], 422);
            }
            $acuan = explode(',', $user->koordinat_acuan);
            if (count($acuan) == 2 && count($current) == 2) {
                $distance = $this->calculateDistance($acuan[0], $acuan[1], $current[0], $current[1]);
                if ($distance > 1.0) { // 1 km = 1000 meters
                    return response()->json([
                        'success' => false,
                        'message' => 'Presensi ditolak. Anda berada di luar radius penugasan.'
                    ], 403);
                }
            }
        } else {
            // Radius 500 meter dari Kantor Bawaslu
            $acuan = [-6.871635322140859, 107.54447933887951];
            
            if (!$isWfhDay && $tipeJadwal !== 'Libur' && count($current) == 2) {
                $distance = $this->calculateDistance($acuan[0], $acuan[1], $current[0], $current[1]);
                if ($distance > 10.0) { // Toleransi 10 km untuk PC/Laptop
                    return response()->json([
                        'success' => false,
                        'message' => 'Presensi ditolak. Hari ini adalah hari WFO dan Anda berada di luar radius dari Kantor Bawaslu. (Lokasi terdeteksi berjarak ' . round($distance * 1000) . ' meter. Titik Anda: ' . implode(',', $current) . ')'
                    ], 403);
                }
            }
        }

        $jamBukaCheckout = Carbon::parse($now->format('Y-m-d') . ' 16:00:00');

        if ($now->lessThan($jamBukaCheckout)) {
            return response()->json([
                'success' => false,
                'message' => 'Sistem check-out belum dibuka. Anda baru bisa check-out mulai pukul 16:00.'
            ], 403);
        }

        $status_co = 'Hadir';

        $path = $request->file('selfie_image')->store('presensi', 'public');

        $presensi->update([
            'timestamp_checkout' => $now,
            'selfie_keluar_url' => $path,
            'status_co' => $status_co,
            // Update koordinat checkout
        ]);

        // Mock send notification
        Log::info("NOTIFIKASI: Foto presensi check-out berhasil diunggah oleh user: " . $user->username);

        return response()->json([
            'success' => true,
            'message' => 'Check-out berhasil.',
            'data' => $presensi
        ], 200);
    }
}
