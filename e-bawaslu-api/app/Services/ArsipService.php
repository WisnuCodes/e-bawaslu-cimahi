<?php

namespace App\Services;

use App\Models\Arsip;
use App\Models\ArsipHistory;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\VersionHistory;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ArsipService
{
    public function storeArsip(array $data, UploadedFile $file, User $user, string $ip)
    {
        $path = $file->store('arsip', 'public');

        $arsip = Arsip::create([
            'id' => (string) Str::uuid(),
            'divisi_id' => $data['divisi_id'],
            'created_by' => $user->user_id,
            'no_surat' => $data['no_surat'],
            'tgl_surat' => $data['tgl_surat'],
            'perihal' => $data['perihal'],
            'kategori' => in_array(strtoupper($data['kategori']), ['LHP', 'LHPP']) ? 'LHP' : $data['kategori'],
            'jenis_pemilihan' => $data['jenis_pemilihan'] ?? null,
            'tahapan_id' => $data['tahapan_id'] ?? null,
            'klasifikasi' => $data['klasifikasi'],
            'jenjang_pengawas' => $data['jenjang_pengawas'] ?? null,
            'catatan_kejadian' => $data['catatan_kejadian'] ?? [],
            'kondisi_kotak_surat' => $data['kondisi_kotak_surat'] ?? null,
            'file_path' => $path,
            'version' => 'v1.0',
            'is_locked' => false,
            'is_deleted' => false,
        ]);

        AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $user->user_id,
            'action' => 'UPLOAD_ARSIP',
            'target_entity' => 'arsip:' . $arsip->id,
            'ip_address' => $ip,
            'reason' => 'Upload dokumen baru: ' . $arsip->no_surat,
            'timestamp' => Carbon::now(),
        ]);

        return $arsip;
    }

    public function reviseArsip(Arsip $arsip, UploadedFile $file, string $catatan, ?User $user, ?string $ip)
    {
        VersionHistory::create([
            'history_id' => (string) Str::uuid(),
            'arsip_id' => $arsip->id,
            'version_name' => $arsip->version,
            'file_path' => $arsip->file_path,
            'uploaded_by' => $user->user_id,
            'catatan_revisi' => $catatan,
            'created_at' => Carbon::now()
        ]);

        $currentVersion = (float) str_replace('v', '', $arsip->version);
        $newVersion = 'v' . number_format($currentVersion + 0.1, 1);

        $path = $file->store('arsip', 'public');

        $arsip->update([
            'version' => $newVersion,
            'file_path' => $path
        ]);

        AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $user->user_id,
            'action' => 'EDIT_ARSIP',
            'target_entity' => 'arsip:' . $arsip->id,
            'ip_address' => $ip,
            'reason' => 'Revisi dokumen (' . $newVersion . '): ' . $arsip->no_surat,
            'timestamp' => Carbon::now(),
        ]);

        return $arsip;
    }
}
