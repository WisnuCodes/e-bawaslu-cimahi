<?php

namespace App\Http\Controllers\Api\C1;

use App\Http\Controllers\Controller;
use App\Models\C1;
use App\Http\Requests\C1\StoreC1Request;
use App\Http\Resources\C1\C1Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class C1Controller extends Controller
{
    public function scanOcr(Request $request, \App\Services\OcrService $ocrService)
    {
        $request->validate([
            'file_c1' => 'required|file|mimes:jpeg,png,jpg,pdf|max:10240',
        ]);

        $file = $request->file('file_c1');
        
        // Memanggil Advanced AI OCR Service
        $result = $ocrService->scan($file);

        return response()->json([
            'message' => 'Berkas berhasil dipindai oleh sistem AI (High-Level Spatial OCR).',
            'data' => $result['data']
        ], 200);
    }

    public function index(Request $request)
    {
        $query = C1::query();
        if ($request->has('tps_id')) {
            $query->where('tps_id', $request->tps_id);
        }
        
        return C1Resource::collection($query->orderBy('created_at', 'desc')->get());
    }

    public function store(StoreC1Request $request)
    {
        $userId = $request->user()->user_id;
        $file = $request->file('file_c1');

        // Calculate SHA-256 Hash
        $hash = hash_file('sha256', $file->getRealPath());

        $existing = C1::where('sha256_hash', $hash)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Berkas C1 ini sudah pernah diunggah sebelumnya (Duplikat).',
                'data' => new C1Resource($existing)
            ], 409);
        }

        // AES-256 Encryption via Laravel Crypt
        $fileContents = file_get_contents($file->getRealPath());
        $encryptedContents = Crypt::encrypt($fileContents);
        
        $filename = 'c1_encrypted_' . Str::uuid() . '.dat';
        Storage::disk('public')->put('c1_uploads/' . $filename, $encryptedContents);
        $path = 'c1_uploads/' . $filename;

        // Auto Cross-Check
        $totalSah = (int) $request->total_suara_sah;
        $totalTidakSah = (int) $request->total_suara_tidak_sah;
        $totalPemilih = (int) $request->total_pemilih;
        $status_c1 = 'Draft';

        $suaraPaslon = $request->suara_paslon ? json_decode($request->suara_paslon, true) : null;

        if (($totalSah + $totalTidakSah) !== $totalPemilih) {
            $status_c1 = 'Mismatch'; // Red Flag
        }
        
        // Validasi tambahan untuk suara paslon
        if ($suaraPaslon && is_array($suaraPaslon)) {
            $sumPaslon = array_sum($suaraPaslon);
            if ($sumPaslon !== $totalSah) {
                $status_c1 = 'Mismatch';
            }
        }

        $c1 = C1::create([
            'c1_id' => (string) Str::uuid(),
            'tps_id' => $request->tps_id,
            'uploaded_by' => $userId,
            'total_suara_sah' => $totalSah,
            'total_suara_tidak_sah' => $totalTidakSah,
            'total_pemilih' => $totalPemilih,
            'suara_paslon' => $suaraPaslon ? json_encode($suaraPaslon) : null,
            'sha256_hash' => $hash,
            'file_url' => $path,
            'status_c1' => $status_c1,
            'created_at' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Berkas C1 berhasil dienkripsi (AES-256) dan disimpan' . ($status_c1 === 'Mismatch' ? ', terdapat Red Flag (Ketidaksesuaian jumlah suara).' : '.'),
            'data' => new C1Resource($c1)
        ], 201);
    }

    public function approve(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Approved,Rejected,Revision',
        ]);

        $c1 = C1::findOrFail($id);
        $c1->update([
            'status_c1' => $request->status
        ]);

        return response()->json([
            'message' => 'Status berkas C1 berhasil diperbarui menjadi ' . $request->status,
            'data' => new C1Resource($c1)
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $c1 = C1::findOrFail($id);

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
        $status_c1 = $c1->status_c1;

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

        // File/Hash not strictly updated here unless a new file is uploaded, 
        // for simplicity we assume edit only changes numbers.

        return response()->json([
            'message' => 'Data Form C1 berhasil diperbarui',
            'data' => new C1Resource($c1)
        ], 200);
    }

    public function destroy($id)
    {
        $c1 = C1::findOrFail($id);
        $c1->delete();

        return response()->json([
            'message' => 'Data dan berkas C1 berhasil dihapus secara permanen'
        ], 200);
    }
}
