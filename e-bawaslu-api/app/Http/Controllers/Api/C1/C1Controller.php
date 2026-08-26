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

        if (($totalSah + $totalTidakSah) !== $totalPemilih) {
            $status_c1 = 'Mismatch'; // Red Flag
        }

        $c1 = C1::create([
            'c1_id' => (string) Str::uuid(),
            'tps_id' => $request->tps_id,
            'uploaded_by' => $userId,
            'total_suara_sah' => $totalSah,
            'total_suara_tidak_sah' => $totalTidakSah,
            'total_pemilih' => $totalPemilih,
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
}
