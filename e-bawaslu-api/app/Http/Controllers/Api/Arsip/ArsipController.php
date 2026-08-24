<?php

namespace App\Http\Controllers\Api\Arsip;

use App\Http\Controllers\Controller;
use App\Models\Arsip;
use App\Http\Requests\Arsip\StoreArsipRequest;
use App\Http\Resources\Arsip\ArsipResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ArsipController extends Controller
{
    /**
     * Get all arsip for a division
     */
    public function index(Request $request)
    {
        // Dummy divisi_id filter for now. Should get from auth user's division
        $divisiId = $request->query('divisi_id');
        $query = Arsip::query();
        if ($divisiId) {
            $query->where('divisi_id', $divisiId);
        }
        
        return ArsipResource::collection($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Store a newly created arsip in storage.
     */
    public function store(StoreArsipRequest $request)
    {
        $userId = $request->user()->user_id;

        $path = null;
        if ($request->hasFile('file_dokumen')) {
            $path = $request->file('file_dokumen')->store('arsip', 'public');
        }

        $arsip = Arsip::create([
            'id' => (string) Str::uuid(),
            'divisi_id' => $request->divisi_id,
            'created_by' => $userId,
            'no_surat' => $request->no_surat,
            'tgl_surat' => $request->tgl_surat,
            'perihal' => $request->perihal,
            'kategori' => $request->kategori,
            'klasifikasi' => $request->klasifikasi,
            'file_path' => $path,
            'version' => 'v1.0',
            'is_locked' => false,
            'is_deleted' => false,
            'created_at' => Carbon::now(),
        ]);

        // Trigger Queue Job for Watermark & OCR here (as per SRS)
        // ProcessArsipJob::dispatch($arsip);

        return response()->json([
            'message' => 'Dokumen arsip berhasil diunggah dan diantrekan untuk diproses.',
            'data' => new ArsipResource($arsip)
        ], 201);
    }
}
