<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lhp;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LhpController extends Controller
{
    public function index(Request $request)
    {
        $query = Lhp::with(['user', 'divisi', 'tahapan']);

        if ($request->has('divisi_id')) {
            $query->where('divisi_id', $request->divisi_id);
        }
        
        if ($request->has('jenis_pemilihan')) {
            $query->where('jenis_pemilihan', $request->jenis_pemilihan);
        }

        $lhp = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $lhp
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'divisi_id' => 'required|uuid|exists:divisi,divisi_id',
            'tahapan_id' => 'required|uuid|exists:tahapan,id',
            'jenis_pemilihan' => 'required|in:Pemilu,Pilkada',
            'sub_jenis_pemilihan' => 'nullable|string',
            'uraian_hasil' => 'nullable|string',
            'bukti_dokumen' => 'nullable|file|mimes:pdf,jpg,png,jpeg|max:5120',
            'kejadian_khusus' => 'nullable|boolean',
            'kondisi_kotak_surat' => 'nullable|string'
        ]);

        $lhpData = [
            'id' => (string) Str::uuid(),
            'user_id' => $request->user()->user_id ?? $request->user()->id, // fallback based on how auth is setup
            'divisi_id' => $request->divisi_id,
            'tahapan_id' => $request->tahapan_id,
            'jenis_pemilihan' => $request->jenis_pemilihan,
            'sub_jenis_pemilihan' => $request->sub_jenis_pemilihan,
            'uraian_hasil' => $request->uraian_hasil,
            'kejadian_khusus' => $request->boolean('kejadian_khusus'),
            'kondisi_kotak_surat' => $request->kondisi_kotak_surat,
            'status' => 'Draft'
        ];

        if ($request->hasFile('bukti_dokumen')) {
            $file = $request->file('bukti_dokumen');
            $path = $file->store('lhp', 'public');
            $lhpData['bukti_dokumen'] = $path;
        }

        $lhp = Lhp::create($lhpData);

        return response()->json([
            'status' => 'success',
            'message' => 'LHP berhasil dibuat.',
            'data' => $lhp
        ], 201);
    }
}
