<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Divisi;
use App\Models\WilayahTps;
use App\Repositories\DivisiRepository;
use App\Repositories\WilayahTpsRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MasterDataController extends Controller
{
    protected $divisiRepo;
    protected $tpsRepo;

    public function __construct(DivisiRepository $divisiRepo, WilayahTpsRepository $tpsRepo)
    {
        $this->divisiRepo = $divisiRepo;
        $this->tpsRepo = $tpsRepo;
    }
    private function isAdminOrKetua($user)
    {
        $role = strtolower($user->role);
        return str_contains($role, 'admin') || str_contains($role, 'superadmin') || str_contains($role, 'ketua');
    }
    public function getDivisi()
    {
        $divisi = $this->divisiRepo->getAllCached();
        return response()->json([
            'success' => true,
            'message' => 'Data Divisi berhasil diambil',
            'data' => $divisi
        ], 200);
    }

    public function getTps()
    {
        $tps = $this->tpsRepo->getAllCached();
        return response()->json([
            'success' => true,
            'message' => 'Data Wilayah TPS berhasil diambil',
            'data' => $tps
        ], 200);
    }

    public function storeDivisi(Request $request)
    {
        if (!$this->isAdminOrKetua($request->user())) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'nama_divisi' => 'required|string|max:100',
            'deskripsi' => 'nullable|string'
        ]);

        $divisi = Divisi::create([
            'divisi_id' => (string) Str::uuid(),
            'nama_divisi' => $request->nama_divisi,
            'deskripsi' => $request->deskripsi
        ]);

        $this->divisiRepo->invalidateCache();

        return response()->json([
            'success' => true,
            'message' => 'Divisi berhasil ditambahkan',
            'data' => $divisi
        ], 201);
    }

    public function updateDivisi(Request $request, $id)
    {
        if (!$this->isAdminOrKetua($request->user())) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'nama_divisi' => 'required|string|max:100',
            'deskripsi' => 'nullable|string'
        ]);

        $divisi = Divisi::findOrFail($id);
        $divisi->update([
            'nama_divisi' => $request->nama_divisi,
            'deskripsi' => $request->deskripsi
        ]);

        $this->divisiRepo->invalidateCache();

        return response()->json([
            'success' => true,
            'message' => 'Divisi berhasil diupdate',
            'data' => $divisi
        ], 200);
    }

    public function destroyDivisi(Request $request, $id)
    {
        if (!$this->isAdminOrKetua($request->user())) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $divisi = Divisi::findOrFail($id);
        $divisi->delete();

        $this->divisiRepo->invalidateCache();

        return response()->json([
            'success' => true,
            'message' => 'Divisi berhasil dihapus'
        ], 200);
    }
}
