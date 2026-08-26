<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Presensi;
use App\Models\Worklog;

class ReportController extends Controller
{
    /**
     * Ekspor Laporan Rekapitulasi ke PDF
     */
    public function exportPdf(Request $request)
    {
        $request->validate([
            'tipe_laporan' => 'required|in:presensi,worklog',
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020|max:2100'
        ]);

        $data = [];
        $title = '';

        if ($request->tipe_laporan === 'presensi') {
            $data = Presensi::whereMonth('timestamp_checkin', $request->bulan)
                            ->whereYear('timestamp_checkin', $request->tahun)
                            ->get();
            $title = "Laporan Rekapitulasi Presensi Bawaslu";
        } elseif ($request->tipe_laporan === 'worklog') {
            $data = Worklog::whereMonth('tgl_kerja', $request->bulan)
                           ->whereYear('tgl_kerja', $request->tahun)
                           ->get();
            $title = "Laporan Rekapitulasi Worklog Harian";
        }

        // Generate HTML sederhana untuk PDF
        $html = "
            <html>
                <head>
                    <style>
                        body { font-family: sans-serif; position: relative; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                        h2 { text-align: center; }
                        .watermark {
                            position: absolute;
                            top: 40%;
                            left: 20%;
                            font-size: 50px;
                            color: rgba(200, 200, 200, 0.3);
                            transform: rotate(-45deg);
                            z-index: -1;
                        }
                    </style>
                </head>
                <body>
                    <div class='watermark'>DOKUMEN RAHASIA BAWASLU<br>DIUNDUH OLEH: {$request->user()->nama}</div>
                    <h2>{$title}</h2>
                    <p>Periode: {$request->bulan} - {$request->tahun}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Informasi</th>
                            </tr>
                        </thead>
                        <tbody>
        ";

        foreach ($data as $item) {
            $info = $request->tipe_laporan === 'presensi' ? $item->status_kehadiran : $item->rincian_aktivitas;
            $id = $request->tipe_laporan === 'presensi' ? $item->presensi_id : $item->worklog_id;
            $html .= "<tr><td>{$id}</td><td>{$info}</td></tr>";
        }

        $html .= "</tbody></table></body></html>";

        $pdf = Pdf::loadHTML($html);

        return $pdf->download("laporan_{$request->tipe_laporan}_{$request->bulan}_{$request->tahun}.pdf");
    }
}
