<?php

namespace App\Http\Controllers\Api\WFH;

use App\Http\Controllers\Controller;
use App\Models\Tukin;
use App\Models\Presensi;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class TukinController extends Controller
{
    public function index(Request $request)
    {
        $user_id = $request->user()->user_id;
        
        $tukin = Tukin::where('user_id', $user_id)
            ->orderBy('tahun', 'desc')
            ->orderBy('bulan', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'message' => 'Data Tunjangan Kinerja berhasil diambil',
            'data' => $tukin
        ], 200);
    }

    public function calculate(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020'
        ]);

        $user_id = $request->user()->user_id;
        $bulan = $request->bulan;
        $tahun = $request->tahun;

        // Hitung total kehadiran dan keterlambatan (sederhana) dari presensi
        // Asumsi jam kerja 08:00 s.d 16:00
        $presensis = Presensi::where('user_id', $user_id)
            ->whereMonth('timestamp_masuk', $bulan)
            ->whereYear('timestamp_masuk', $tahun)
            ->get();

        $total_jam_kerja = 0;
        $total_keterlambatan_menit = 0;

        foreach ($presensis as $p) {
            if ($p->timestamp_checkout) {
                $masuk = Carbon::parse($p->timestamp_masuk);
                $keluar = Carbon::parse($p->timestamp_checkout);
                $jam = $masuk->diffInHours($keluar);
                $total_jam_kerja += $jam;

                // Cek keterlambatan (jam masuk ideal 08:00)
                $jam_ideal = Carbon::parse($masuk->format('Y-m-d') . ' 08:00:00');
                if ($masuk->greaterThan($jam_ideal)) {
                    $total_keterlambatan_menit += $masuk->diffInMinutes($jam_ideal);
                }
            }
        }

        // Kalkulasi tukin (contoh basis: 5.000.000, potong 10.000 per menit terlambat)
        $basis_tukin = 5000000;
        $potongan = $total_keterlambatan_menit * 10000;
        $akumulasi_tukin = max(0, $basis_tukin - $potongan);

        // Update or Create Tukin Record
        $tukin = Tukin::updateOrCreate(
            ['user_id' => $user_id, 'bulan' => $bulan, 'tahun' => $tahun],
            [
                'rekap_id' => Str::uuid()->toString(),
                'total_jam_kerja' => $total_jam_kerja,
                'total_keterlambatan' => $total_keterlambatan_menit,
                'akumulasi_tukin' => $akumulasi_tukin,
                'created_at' => now()
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Kalkulasi Tunjangan Kinerja berhasil dilakukan',
            'data' => $tukin
        ], 200);
    }
}
