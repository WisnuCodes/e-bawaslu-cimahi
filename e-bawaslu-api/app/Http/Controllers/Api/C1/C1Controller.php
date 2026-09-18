<?php

namespace App\Http\Controllers\Api\C1;

use App\Http\Controllers\Controller;
use App\Models\C1;
use App\Support\C1Access;
use App\Http\Requests\C1\StoreC1Request;
use App\Http\Resources\C1\C1Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Services\C1Service;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class C1Controller extends Controller
{
    protected $c1Service;

    public function __construct(C1Service $c1Service)
    {
        $this->c1Service = $c1Service;
    }
    public function scanOcr(Request $request, \App\Services\OcrService $ocrService)
    {
        abort_unless(C1Access::write($request->user()), 403, 'Anda tidak memiliki akses C1.');
        $request->validate([
            'file_c1' => 'required|file|mimes:jpeg,png,jpg,pdf|max:10240',
        ]);

        $file = $request->file('file_c1');
        $allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return response()->json(['message' => 'Format berkas tidak valid. Terdeteksi ekstensi palsu.'], 422);
        }
        
        // Memanggil Advanced AI OCR Service
        $result = $ocrService->scan($file);

        return response()->json([
            'message' => 'Berkas berhasil dipindai oleh sistem AI (High-Level Spatial OCR).',
            'data' => $result['data']
        ], 200);
    }

    public function index(Request $request)
    {
        abort_unless(C1Access::read($request->user()), 403, 'Anda tidak memiliki akses C1.');
        $query = C1::query()
            ->join('wilayah_tps', 'berkas_c1.tps_id', '=', 'wilayah_tps.tps_id')
            ->select('berkas_c1.*', 'wilayah_tps.kecamatan', 'wilayah_tps.kelurahan');

        if ($request->has('tps_id')) {
            $query->where('berkas_c1.tps_id', $request->tps_id);
        }
        if ($request->has('kecamatan')) {
            $query->where('wilayah_tps.kecamatan', $request->kecamatan);
        }
        if ($request->has('kelurahan')) {
            $query->where('wilayah_tps.kelurahan', $request->kelurahan);
        }
        
        return C1Resource::collection($query->orderBy('berkas_c1.created_at', 'desc')->get());
    }

    public function store(StoreC1Request $request)
    {
        abort_unless(C1Access::write($request->user()), 403, 'Anda tidak memiliki akses C1.');
        
        $result = $this->c1Service->storeC1(
            $request->file('file_c1'),
            $request->all(),
            $request->user()->user_id
        );

        if ($result['status'] === 'conflict') {
            return response()->json([
                'message' => 'Berkas C1 ini sudah pernah diunggah sebelumnya (Duplikat).',
                'data' => new C1Resource($result['c1'])
            ], 409);
        }

        $c1 = $result['c1'];
        $status_msg = $c1->status_c1 === 'Mismatch' ? ', terdapat Red Flag (Ketidaksesuaian jumlah suara).' : '.';

        \App\Models\AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $request->user()->user_id,
            'action' => 'UPLOAD_C1',
            'target_entity' => 'c1:'.$c1->id,
            'ip_address' => $request->ip(),
            'reason' => 'Mengunggah dan mengenkripsi Form C1',
            'timestamp' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Berkas C1 berhasil dienkripsi (AES-256) dan disimpan' . $status_msg,
            'data' => new C1Resource($c1)
        ], 201);
    }

    public function approve(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Approved,Rejected,Revision',
        ]);

        $c1 = C1::findOrFail($id);
        
        abort_unless(C1Access::approve($request->user(), $c1), 403, 'Approval hanya untuk pimpinan atau kepala divisi yang ditunjuk admin.');
        abort_unless($c1->status_c1 === 'Draft', 422, 'Hanya C1 berstatus Draft yang dapat disetujui atau ditolak.');

        $c1->update([
            'status_c1' => $request->status
        ]);

        \App\Models\AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $request->user()->user_id,
            'action' => 'APPROVE_C1',
            'target_entity' => 'c1:'.$c1->id,
            'ip_address' => $request->ip(),
            'reason' => 'Mengubah status C1 menjadi ' . $request->status,
            'timestamp' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Status berkas C1 berhasil diperbarui menjadi ' . $request->status,
            'data' => new C1Resource($c1)
        ], 200);
    }

    public function update(Request $request, $id)
    {
        abort_unless(C1Access::write($request->user()), 403);
        $c1 = C1::findOrFail($id);
        abort_if($c1->status_c1 === 'Approved', 422, 'C1 yang sudah disetujui tidak dapat diubah.');

        $request->validate([
            'tps_id' => 'required|exists:wilayah_tps,tps_id',
            'total_suara_sah' => 'required|integer|min:0',
            'total_suara_tidak_sah' => 'required|integer|min:0',
            'total_pemilih' => 'required|integer|min:0',
            'suara_paslon' => 'nullable|json'
        ]);

        $totalSah = (int) $request->total_suara_sah;
        $totalTidakSah = (int) $request->total_suara_tidak_sah;
        $totalPemilih = (int) $request->total_pemilih;
        $status_c1 = 'Draft';

        $suaraPaslon = $request->suara_paslon ? json_decode($request->suara_paslon, true) : null;

        if (($totalSah + $totalTidakSah) !== $totalPemilih) {
            $status_c1 = 'Mismatch'; 
        } else {
            // Re-evaluate if it was mismatch but now is fixed
            if ($status_c1 === 'Mismatch') {
                $status_c1 = 'Draft';
            }
        }
        
        if ($suaraPaslon && is_array($suaraPaslon)) {
            $sumPaslon = array_sum($suaraPaslon);
            if ($sumPaslon !== $totalSah) {
                $status_c1 = 'Mismatch';
            }
        }

        $c1->update([
            'tps_id' => $request->tps_id,
            'total_suara_sah' => $totalSah,
            'total_suara_tidak_sah' => $totalTidakSah,
            'total_pemilih' => $totalPemilih,
            'suara_paslon' => $suaraPaslon ? json_encode($suaraPaslon) : null,
            'status_c1' => $status_c1
        ]);

        \App\Models\AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $request->user()->user_id,
            'action' => 'UPDATE_C1',
            'target_entity' => 'c1:'.$c1->id,
            'ip_address' => $request->ip(),
            'reason' => 'Memperbarui data angka Form C1',
            'timestamp' => Carbon::now(),
        ]);

        // File/Hash not strictly updated here unless a new file is uploaded, 
        // for simplicity we assume edit only changes numbers.

        return response()->json([
            'message' => 'Data Form C1 berhasil diperbarui',
            'data' => new C1Resource($c1)
        ], 200);
    }

    public function assignApproval(Request $request, $id)
    {
        abort_unless(C1Access::admin($request->user()), 403);
        $data = $request->validate(['approval_divisi_id' => 'required|uuid|exists:divisi,divisi_id']);
        $c1 = C1::findOrFail($id);
        $c1->update($data);
        return response()->json(['message' => 'Divisi approval berhasil ditetapkan.', 'data' => new C1Resource($c1)]);
    }

    public function download(Request $request, $id)
    {
        abort_unless(C1Access::read($request->user()), 403);
        $c1 = C1::findOrFail($id);
        abort_unless(Storage::disk('public')->exists($c1->file_url), 404, 'Dokumen tidak ditemukan.');
        $contents = Crypt::decrypt(Storage::disk('public')->get($c1->file_url));
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($contents);
        $extension = match ($mime) { 'image/png' => 'png', 'application/pdf' => 'pdf', default => 'jpg' };
        \App\Models\AuditLog::create([
            'log_id' => (string) Str::uuid(), 'actor_id' => $request->user()->user_id,
            'action' => 'DOWNLOAD_C1', 'target_entity' => 'c1:'.$id,
            'ip_address' => $request->ip(), 'reason' => 'Unduh dokumen C1', 'timestamp' => Carbon::now(),
        ]);
        return response($contents)->header('Content-Type', $mime)
            ->header('Content-Disposition', 'attachment; filename="C1-'.$id.'.'.$extension.'"')
            ->header('Cache-Control', 'private, no-store');
    }

    public function destroy(Request $request, $id)
    {
        abort_unless(C1Access::leadership($request->user()), 403);
        $c1 = C1::findOrFail($id);
        $c1Id = $c1->id;
        $c1->delete();

        \App\Models\AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $request->user()->user_id,
            'action' => 'DELETE_C1',
            'target_entity' => 'c1:'.$c1Id,
            'ip_address' => $request->ip(),
            'reason' => 'Menghapus C1 secara permanen',
            'timestamp' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Data dan berkas C1 berhasil dihapus secara permanen'
        ], 200);
    }
}
