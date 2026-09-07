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

    public function destroy(Request $request, string $id)
    {
        $role = strtolower($request->user()->role);
        abort_unless(!str_contains($role, 'tamu') && (str_contains($role, 'ketua') || str_contains($role, 'admin')), 403);
        return \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            $tahapan = Tahapan::whereKey($id)->lockForUpdate()->firstOrFail();
            if (\App\Models\Arsip::withTrashed()->where('tahapan_id', $id)->exists()
                || \App\Models\Lhp::where('tahapan_id', $id)->exists()) {
                return response()->json(['message' => 'Tahapan sudah digunakan dalam laporan dan tidak dapat dihapus.'], 409);
            }
            $tahapan->delete();
            return response()->json(['message' => 'Tahapan berhasil dihapus.']);
        });
    }

    public function store(Request $request)
    {
        $role = strtolower($request->user()->role);
        abort_unless(str_contains($role, 'ketua') || str_contains($role, 'admin'), 403, 'Hanya Ketua dan Superadmin yang dapat mengatur tahapan.');

        $request->validate([
            'divisi_id' => 'required|uuid|exists:divisi,divisi_id',
            'nama_tahapan' => 'required|string|max:255',
        ]);

        if (preg_match('/penetapan.*(caleg|calon legislatif)/i', $request->nama_tahapan)) {
            $divisi = \App\Models\Divisi::findOrFail($request->divisi_id);
            if (!str_contains(strtolower($divisi->nama_divisi), 'sengketa')) {
                throw \Illuminate\Validation\ValidationException::withMessages(['divisi_id' => 'Penetapan caleg harus berada di divisi Penyelesaian Sengketa.']);
            }
        }

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
