<?php

namespace App\Http\Controllers\Api\WFH;

use App\Http\Controllers\Controller;
use App\Models\Presensi;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PresensiController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Presensi::query()
            ->join('users', 'presensi_wfh.user_id', '=', 'users.user_id')
            ->select('presensi_wfh.*', 'users.username as nama_pegawai')
            ->orderBy('timestamp_checkin', 'desc');

        $role = strtolower($user->role);
        $isAdmin = str_contains($role, 'admin') || str_contains($role, 'superadmin');
        $isPimpinan = str_contains($role, 'ketua') || str_contains($role, 'pimpinan') || str_contains($role, 'koordinator sekretariat');
        $isKadiv = str_contains($role, 'kordiv') || str_contains($role, 'kepala divisi') || str_contains($role, 'kasubag') || str_contains($role, 'kabag');

        $canManageOther = $isAdmin || $isPimpinan || $isKadiv;

        // Tampilkan semua untuk admin, pimpinan, kadiv. Jika staf, hanya miliknya sendiri.
        if (!$canManageOther) {
            $query->where('presensi_wfh.user_id', $user->user_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()
        ], 200);
    }
    public function update(Request $request, $id)
    {
        $presensi = Presensi::findOrFail($id);

        $user = $request->user();
        $role = strtolower($user->role);
        $isAdmin = str_contains($role, 'admin') || str_contains($role, 'superadmin');

        // Yang bisa edit: user itu sendiri (untuk absennya) ATAU Admin (untuk semua orang)
        if ($presensi->user_id !== $user->user_id && !$isAdmin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Hanya Admin yang dapat mengedit presensi user lain.'], 403);
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
            'gps_koordinat' => 'required|string',
            'liveness_score' => 'required|numeric'
        ]);

        if ($request->liveness_score < 0.8) {
            return response()->json([
                'success' => false,
                'message' => 'Presensi ditolak. Sistem mendeteksi kemungkinan foto cetak atau layar perangkat (Spoofing).'
            ], 403);
        }

        $userId = $request->user()->user_id;
        $path = $request->file('selfie_image')->store('presensi', 'public');
        $now = Carbon::now();

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
            'gps_koordinat' => $request->gps_koordinat,
            'liveness_score' => $request->liveness_score
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Check-in berhasil tercatat.',
            'data' => $presensi
        ], 201);
    }

    public function checkOut(Request $request)
    {
        $request->validate([
            'presensi_id' => 'required|uuid',
            'selfie_image' => 'required|file|mimes:jpeg,png,jpg',
            'gps_koordinat' => 'required|string',
            'liveness_score' => 'required|numeric'
        ]);

        if ($request->liveness_score < 0.8) {
            return response()->json([
                'success' => false,
                'message' => 'Check-out ditolak. Liveness detection gagal.'
            ], 403);
        }

        $presensi = Presensi::findOrFail($request->presensi_id);

        if ($presensi->user_id !== $request->user()->user_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $now = Carbon::now();
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

        return response()->json([
            'success' => true,
            'message' => 'Check-out berhasil.',
            'data' => $presensi
        ], 200);
    }
}
