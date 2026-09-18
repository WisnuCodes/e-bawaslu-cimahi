<?php

namespace App\Services;

use App\Models\C1;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class C1Service
{
    /**
     * Store C1 with encryption and validation
     *
     * @param UploadedFile $file
     * @param array $data
     * @param string $userId
     * @return array
     */
    public function storeC1(UploadedFile $file, array $data, string $userId)
    {
        $hash = hash_file('sha256', $file->getRealPath());

        $existing = C1::where('sha256_hash', $hash)->first();
        if ($existing) {
            return ['status' => 'conflict', 'c1' => $existing];
        }

        $fileContents = file_get_contents($file->getRealPath());
        $encryptedContents = Crypt::encrypt($fileContents);
        
        $filename = 'c1_encrypted_' . Str::uuid() . '.dat';
        Storage::disk('public')->put('c1_uploads/' . $filename, $encryptedContents);
        $path = 'c1_uploads/' . $filename;

        $totalSah = (int) $data['total_suara_sah'];
        $totalTidakSah = (int) $data['total_suara_tidak_sah'];
        $totalPemilih = (int) $data['total_pemilih'];
        $status_c1 = 'Draft';

        $suaraPaslon = isset($data['suara_paslon']) ? json_decode($data['suara_paslon'], true) : null;

        if (($totalSah + $totalTidakSah) !== $totalPemilih) {
            $status_c1 = 'Mismatch';
        }
        
        if ($suaraPaslon && is_array($suaraPaslon)) {
            $sumPaslon = array_sum($suaraPaslon);
            if ($sumPaslon !== $totalSah) {
                $status_c1 = 'Mismatch';
            }
        }

        $c1 = C1::create([
            'c1_id' => (string) Str::uuid(),
            'tps_id' => $data['tps_id'],
            'uploaded_by' => $userId,
            'jenis_pemilihan' => $data['jenis_pemilihan'] ?? 'Pemilu',
            'sub_jenis_pemilihan' => $data['sub_jenis_pemilihan'] ?? null,
            'total_suara_sah' => $totalSah,
            'total_suara_tidak_sah' => $totalTidakSah,
            'total_pemilih' => $totalPemilih,
            'suara_paslon' => $suaraPaslon ? json_encode($suaraPaslon) : null,
            'sha256_hash' => $hash,
            'file_url' => $path,
            'status_c1' => $status_c1,
            'created_at' => Carbon::now(),
        ]);

        return ['status' => 'success', 'c1' => $c1];
    }
}
