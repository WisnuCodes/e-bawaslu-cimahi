<?php

namespace App\Http\Controllers\Api\C1;

use App\Http\Controllers\Controller;
use App\Models\C1;
use App\Http\Requests\C1\StoreC1Request;
use App\Http\Resources\C1\C1Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class C1Controller extends Controller
{
    /**
     * Get all C1 files (with optional TPS filter)
     */
    public function index(Request $request)
    {
        $query = C1::query();
        if ($request->has('tps_id')) {
            $query->where('tps_id', $request->tps_id);
        }
        
        return C1Resource::collection($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Store a newly created C1 in storage and hash it.
     */
    public function store(StoreC1Request $request)
    {
        $userId = $request->user()->user_id;
        $file = $request->file('file_c1');

        // Calculate SHA-256 Hash of the file for integrity
        $hash = hash_file('sha256', $file->getRealPath());

        // Check if a file with the same hash already exists (duplicate prevention)
        $existing = C1::where('sha256_hash', $hash)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Berkas C1 ini sudah pernah diunggah sebelumnya (Duplikat).',
                'data' => new C1Resource($existing)
            ], 409);
        }

        $path = $file->store('c1_uploads', 'public');

        // Cross-Check Validation Algorithm
        // total_suara_sah + total_suara_tidak_sah must equal total_pemilih
        $totalSah = (int) $request->total_suara_sah;
        $totalTidakSah = (int) $request->total_suara_tidak_sah;
        $totalPemilih = (int) $request->total_pemilih;
        $status_c1 = 'Draft';

        if (($totalSah + $totalTidakSah) !== $totalPemilih) {
            // Flag as mismatch for manual review
            $status_c1 = 'Mismatch';
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
            'message' => 'Berkas C1 berhasil diunggah' . ($status_c1 === 'Mismatch' ? ', namun terdapat ketidaksesuaian jumlah suara.' : ' dan diverifikasi.'),
            'data' => new C1Resource($c1)
        ], 201);
    }

    /**
     * Approval Workflow (State Machine)
     */
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
