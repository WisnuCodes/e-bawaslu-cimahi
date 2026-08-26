<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Divisi;
use App\Models\WilayahTps;
use Illuminate\Http\Request;

class MasterDataController extends Controller
{
    public function getDivisi()
    {
        $divisi = Divisi::all();
        return response()->json([
            'success' => true,
            'message' => 'Data Divisi berhasil diambil',
            'data' => $divisi
        ], 200);
    }

    public function getTps()
    {
        $tps = WilayahTps::all();
        return response()->json([
            'success' => true,
            'message' => 'Data Wilayah TPS berhasil diambil',
            'data' => $tps
        ], 200);
    }
}
