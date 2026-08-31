<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tahapan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TahapanController extends Controller
{
    public function index(Request $request)
    {
        $query = Tahapan::with('divisi');

        if ($request->has('divisi_id')) {
            $query->where('divisi_id', $request->divisi_id);
        }

        $tahapan = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $tahapan
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'divisi_id' => 'required|uuid|exists:divisi,divisi_id',
            'nama_tahapan' => 'required|string|max:255',
        ]);

        $tahapan = Tahapan::create([
            'id' => (string) Str::uuid(),
            'divisi_id' => $request->divisi_id,
            'nama_tahapan' => $request->nama_tahapan,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tahapan berhasil ditambahkan.',
            'data' => $tahapan
        ], 201);
    }
}
