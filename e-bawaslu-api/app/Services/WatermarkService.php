<?php

namespace App\Services;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class WatermarkPdfInternal extends Fpdi
{
    protected $extgstates = [];
    protected $angle = 0;

    public function SetAlpha($alpha, $bm = 'Normal')
    {
        $gs = $this->AddExtGState(['ca' => $alpha, 'CA' => $alpha, 'BM' => '/' . $bm]);
        $this->SetExtGState($gs);
    }

    public function AddExtGState($parms)
    {
        $n = count($this->extgstates) + 1;
        $this->extgstates[$n]['parms'] = $parms;
        return $n;
    }

    public function SetExtGState($gs)
    {
        $this->_out(sprintf('/GS%d gs', $gs));
    }

    public function _enddoc()
    {
        if (!empty($this->extgstates) && $this->PDFVersion < '1.4') {
            $this->PDFVersion = '1.4';
        }
        parent::_enddoc();
    }

    protected function _putresources()
    {
        $this->_putextgstates();
        parent::_putresources();
    }

    protected function _putextgstates()
    {
        for ($i = 1; $i <= count($this->extgstates); $i++) {
            $this->_newobj();
            $this->extgstates[$i]['n'] = $this->n;
            $this->_put('<</Type /ExtGState');
            $parms = $this->extgstates[$i]['parms'];
            $this->_put(sprintf('/ca %.3F', $parms['ca']));
            $this->_put(sprintf('/CA %.3F', $parms['CA']));
            $this->_put(sprintf('/BM %s', $parms['BM']));
            $this->_put('>>');
            $this->_put('endobj');
        }
    }

    protected function _putresourcedict()
    {
        parent::_putresourcedict();
        if (!empty($this->extgstates)) {
            $this->_put('/ExtGState <<');
            foreach ($this->extgstates as $k => $extgstate) {
                $this->_put('/GS' . $k . ' ' . $extgstate['n'] . ' 0 R');
            }
            $this->_put('>>');
        }
    }

    public function Rotate($angle, $x = -1, $y = -1)
    {
        if ($x == -1) $x = $this->x;
        if ($y == -1) $y = $this->y;
        if ($this->angle != 0) $this->_out('Q');
        $this->angle = $angle;
        if ($angle != 0) {
            $angle *= M_PI / 180;
            $c = cos($angle);
            $s = sin($angle);
            $cx = $x * $this->k;
            $cy = ($this->h - $y) * $this->k;
            $this->_out(sprintf('q %.5F %.5F %.5F %.5F %.2F %.2F cm 1 0 0 1 %.2F %.2F cm', $c, $s, -$s, $c, $cx, $cy, -$cx, -$cy));
        }
    }

    public function _endpage()
    {
        if ($this->angle != 0) {
            $this->angle = 0;
            $this->_out('Q');
        }
        parent::_endpage();
    }
}

class WatermarkService
{
    /**
     * Terapkan cap air dinamis semi-transparan pada berkas PDF
     * Berisi: nama akun pengakses, alamat IP, dan waktu unduh.
     *
     * @param string $filePath Path lengkap berkas asli di server
     * @param string $username Nama akun pengakses (misal: staf_persuratan)
     * @param string $ipAddress Alamat IP pengunduh
     * @param Carbon|null $timestamp Waktu unduh
     * @return string Konten biner PDF yang telah diberi watermark
     */
    public function applyDynamicWatermark(string $filePath, string $username, string $ipAddress, ?Carbon $timestamp = null): string
    {
        $timeStr = ($timestamp ?? Carbon::now())->format('d/m/Y H:i:s') . ' WIB';

        try {
            $pdf = new WatermarkPdfInternal();
            $pageCount = $pdf->setSourceFile($filePath);

            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                $tplIdx = $pdf->importPage($pageNo);
                $size = $pdf->getTemplateSize($tplIdx);
                
                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($tplIdx);

                $w = $size['width'];
                $h = $size['height'];
                $centerX = $w / 2;
                $centerY = $h / 2;

                // 1. Cap Air Dinamis Diagonal di Tengah Halaman
                $pdf->SetAlpha(0.30);
                $pdf->SetFont('Arial', 'B', 15);
                $pdf->SetTextColor(170, 30, 30);

                $title = "BAWASLU KOTA CIMAHI - NASKAH DINAS";
                $account = "AKUN PENGAKSES: " . strtoupper($username);
                $ipLine = "ALAMAT IP: {$ipAddress}";
                $timeLine = "WAKTU UNDUH: {$timeStr}";

                $pdf->Rotate(45, $centerX, $centerY);
                
                // Blok Tengah Utama
                $pdf->Text($centerX - ($pdf->GetStringWidth($title) / 2), $centerY - 16, $title);
                $pdf->SetFont('Arial', 'B', 13);
                $pdf->Text($centerX - ($pdf->GetStringWidth($account) / 2), $centerY - 3, $account);
                $pdf->SetFont('Arial', 'B', 11);
                $pdf->Text($centerX - ($pdf->GetStringWidth($ipLine) / 2), $centerY + 9, $ipLine);
                $pdf->Text($centerX - ($pdf->GetStringWidth($timeLine) / 2), $centerY + 20, $timeLine);

                // Pola Diagonal Tambahan Atas & Bawah
                $pdf->SetAlpha(0.18);
                $pdf->SetFont('Arial', 'B', 10);
                $subStamp = "DYNAMIC WATERMARK - {$username} - {$ipAddress} - {$timeStr}";
                $pdf->Text($centerX - ($pdf->GetStringWidth($subStamp) / 2), $centerY - 70, $subStamp);
                $pdf->Text($centerX - ($pdf->GetStringWidth($subStamp) / 2), $centerY + 70, $subStamp);

                $pdf->Rotate(0);

                // 2. Cap Air Identitas Header & Footer
                $pdf->SetAlpha(0.60);
                $pdf->SetFont('Arial', 'B', 8);
                $pdf->SetTextColor(70, 70, 70);

                $bannerTop = "RAHASIA & TERBATAS | Cap Air Dinamis: {$username} | IP: {$ipAddress} | {$timeStr}";
                $bannerBottom = "Dynamic Watermark Bawaslu Kota Cimahi - Akun Pengakses: [{$username}] - IP: [{$ipAddress}] - Unduh: [{$timeStr}]";

                $pdf->Text(10, 8, $bannerTop);
                $pdf->Text(10, $h - 6, $bannerBottom);

                // Reset Alpha ke 1.0 (Normal)
                $pdf->SetAlpha(1.0);
            }

            return $pdf->Output('S');
        } catch (\Throwable $e) {
            Log::warning("Gagal menerapkan dynamic watermark via FPDI: " . $e->getMessage() . ". Mengembalikan berkas asli.");
            return file_get_contents($filePath);
        }
    }
}
