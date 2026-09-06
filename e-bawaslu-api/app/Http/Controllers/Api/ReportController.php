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
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $data = [];
        $title = '';

        if ($request->tipe_laporan === 'presensi') {
            $data = Presensi::join('users', 'presensi_wfh.user_id', '=', 'users.user_id')
                            ->select('presensi_wfh.*', 'users.username')
                            ->whereDate('timestamp_checkin', '>=', $request->start_date)
                            ->whereDate('timestamp_checkin', '<=', $request->end_date)
                            ->get();
            $title = "Laporan Rekapitulasi Presensi Bawaslu";
        } elseif ($request->tipe_laporan === 'worklog') {
            $data = Worklog::join('users', 'daily_worklog.user_id', '=', 'users.user_id')
                           ->select('daily_worklog.*', 'users.username')
                           ->whereDate('tgl_kerja', '>=', $request->start_date)
                           ->whereDate('tgl_kerja', '<=', $request->end_date)
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
                    <div class='watermark'>DOKUMEN RAHASIA BAWASLU<br>DIUNDUH OLEH: {$request->user()->username}</div>
                    <h2>{$title}</h2>
                    <p>Periode: {$request->start_date} s.d. {$request->end_date}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
        ";

        if ($request->tipe_laporan === 'presensi') {
            $html .= "
                                <th>Tanggal</th>
                                <th>Jam Masuk</th>
                                <th>Jam Keluar</th>
                                <th>Status CI</th>
                                <th>Status CO</th>
            ";
        } else {
            $html .= "
                                <th>Tanggal Kerja</th>
                                <th>Rincian Aktivitas</th>
                                <th>Status Approval</th>
            ";
        }

        $html .= "
                            </tr>
                        </thead>
                        <tbody>
        ";

        foreach ($data as $item) {
            $html .= "<tr>";
            $html .= "<td>{$item->username}</td>";
            
            if ($request->tipe_laporan === 'presensi') {
                $tanggal = date('Y-m-d', strtotime($item->timestamp_checkin));
                $jamMasuk = date('H:i:s', strtotime($item->timestamp_checkin));
                $jamKeluar = $item->timestamp_checkout ? date('H:i:s', strtotime($item->timestamp_checkout)) : '-';
                
                $html .= "<td>{$tanggal}</td>";
                $html .= "<td>{$jamMasuk}</td>";
                $html .= "<td>{$jamKeluar}</td>";
                $html .= "<td>{$item->status_ci}</td>";
                $html .= "<td>" . ($item->status_co ?: 'Belum CO') . "</td>";
            } else {
                $tanggal = date('Y-m-d', strtotime($item->tgl_kerja));
                $html .= "<td>{$tanggal}</td>";
                $html .= "<td>{$item->rincian_aktivitas}</td>";
                $html .= "<td>{$item->status_approval}</td>";
            }
            
            $html .= "</tr>";
        }

        $html .= "</tbody></table></body></html>";

        $pdf = Pdf::loadHTML($html);

        return $pdf->download("laporan_{$request->tipe_laporan}_{$request->start_date}_{$request->end_date}.pdf");
    }
}
