<?php

namespace App\Http\Controllers\Api\Arsip;

use App\Http\Controllers\Controller;
use App\Models\Arsip;
use App\Models\VersionHistory;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Services\ArsipService;

class ArsipController extends Controller
{
    protected $arsipService;

    public function __construct(ArsipService $arsipService)
    {
        $this->arsipService = $arsipService;
    }
    public function index(Request $request)
    {
        $query = Arsip::query();

        if ($request->has('divisi_id')) {
            $query->where('divisi_id', $request->divisi_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('tgl_surat', 'desc')->get()
        ], 200);
    }

    /**
     * MOCK Elasticsearch / OCR Full-text Search
     */
    public function search(Request $request)
    {
        $keyword = $request->query('q');
        if (!$keyword) {
            return response()->json(['success' => false, 'message' => 'Kata kunci (q) wajib diisi'], 400);
        }

        // Simulasi query pencarian teks yang biasanya dilakukan oleh Elasticsearch
        $results = Arsip::where('perihal', 'LIKE', "%{$keyword}%")
            ->orWhere('no_surat', 'LIKE', "%{$keyword}%")
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Hasil pencarian Full-text OCR.',
            'data' => $results
        ], 200);
    }

    public function store(Request $request)
    {
        abort_if(str_contains(strtolower($request->user()->role), 'tamu'), 403, 'Role Tamu hanya dapat melihat dan mengunduh dokumen.');
        if (in_array(strtoupper($request->input('kategori', '')), ['LHP', 'LHPP'])) {
            $request->merge(['kategori' => 'LHP']);
        }
        $request->validate([
            'divisi_id' => 'required|uuid|exists:divisi,divisi_id',
            'jenis_pemilihan' => 'required_if:kategori,LHP,LHPP|nullable|in:Pemilu,Pilkada',
            'tahapan_id' => ['required_if:kategori,LHP,LHPP', 'nullable', 'uuid', \Illuminate\Validation\Rule::exists('tahapan', 'id')->where('divisi_id', $request->divisi_id)],
            'no_surat' => 'required|string',
            'tgl_surat' => 'required|date',
            'perihal' => 'required|string',
            'kategori' => 'required|string',
            'pengirim' => 'nullable|string',
            'divisi_tujuan' => 'nullable|uuid|exists:divisi,divisi_id',
            'jenjang_pengawas' => 'required_if:kategori,MHP|nullable|in:Panwascam,PKD,PTPS',
            'klasifikasi' => 'required|string',
            'catatan_kejadian' => 'nullable|array|max:3',
            'catatan_kejadian.*' => 'required|string|max:2000',
            'kondisi_kotak_surat' => 'nullable|string|max:2000',
            'file_dokumen' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120'
        ], [
            'file_dokumen.mimes' => 'Format berkas tidak didukung. Sistem menolak berkas berformat selain PDF, DOC, DOCX, JPG, dan PNG (seperti .zip atau .exe).',
            'file_dokumen.max' => 'Ukuran berkas melebihi batas maksimal 5 MB.'
        ]);

        abort_if(str_contains(strtolower($request->user()->role), 'tamu'), 403, 'Role Tamu hanya dapat melihat data.');
        $user = $request->user();
        $userId = $user->user_id;

        // Validasi Role Khusus LHPP / LHP / MHP
        $allowedRoles = ['p2h', 'panwascam', 'pkd', 'ptps', 'pengawas tps', 'staf', 'pegawai', 'kordiv', 'kadiv', 'kepala divisi', 'kasubag', 'kabag', 'bendahara', 'koordinator sekretariat', 'pimpinan', 'ketua', 'admin'];
        $userRoleLower = strtolower($user->role);
        
        $isKetuaOrAdmin = str_contains($userRoleLower, 'ketua') || str_contains($userRoleLower, 'admin');

        // Panwascam (tamu) viewer only (unless they are also somehow admin/ketua which is unlikely)
        if (str_contains($userRoleLower, 'panwascam (tamu)') && !$isKetuaOrAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Role Tamu hanya dapat melihat data (viewer).'
            ], 403);
        }

        $isAllowedLhp = false;
        foreach ($allowedRoles as $r) {
            if (str_contains($userRoleLower, $r)) {
                $isAllowedLhp = true;
                break;
            }
        }

        if (in_array(strtoupper($request->kategori), ['LHPP', 'LHP', 'MHP']) && !$isAllowedLhp) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Role Anda tidak berwenang mengunggah Laporan Hasil Pengawasan (LHP/MHP).'
            ], 403);
        }

        $arsip = $this->arsipService->storeArsip(
            $request->all(),
            $request->file('file_dokumen'),
            $user,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => str_starts_with($request->file('file_dokumen')->getMimeType(), 'image/')
                ? 'Foto berhasil diunggah dan laporan berhasil disimpan.' : 'Dokumen berhasil diunggah dan disimpan.',
            'data' => $arsip
        ], 201);
    }

    public function uploadRevisi(Request $request, $id)
    {
        $arsip = Arsip::findOrFail($id);
        abort_if(str_contains(strtolower($request->user()->role), 'tamu'), 403);
        abort_if(in_array($arsip->kategori, ['LHP', 'LHPP']) && str_contains(strtolower($request->user()->role), 'tamu'), 403, 'Role Tamu hanya dapat melihat data.');

        if ($arsip->is_locked) {
            return response()->json(['success' => false, 'message' => 'Dokumen sedang dikunci dan tidak dapat direvisi.'], 403);
        }

        $request->validate([
            'file_dokumen' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120',
            'catatan_revisi' => 'required|string'
        ], [
            'file_dokumen.mimes' => 'Format berkas tidak didukung. Sistem menolak berkas berformat selain PDF, DOC, DOCX, JPG, dan PNG (seperti .zip atau .exe).',
            'file_dokumen.max' => 'Ukuran berkas melebihi batas maksimal 5 MB.'
        ]);

        $arsip = $this->arsipService->reviseArsip(
            $arsip,
            $request->file('file_dokumen'),
            $request->catatan_revisi,
            $request->user(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "Revisi berhasil diunggah ({$arsip->version}).",
            'data' => $arsip
        ], 200);
    }

    public function getVersions($id)
    {
        $arsip = Arsip::findOrFail($id);
        $versions = VersionHistory::where('arsip_id', $arsip->id)->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'current_version' => $arsip,
                'history' => $versions
            ]
        ], 200);
    }

    /**
     * Pratinjau Dokumen Digital Inline pada Peramban & Catat Audit Trail
     */
    public function preview(Request $request, string $id)
    {
        $arsip = Arsip::findOrFail($id);
        $user = $request->user();
        $accountName = $user ? ($user->username ?? $user->name ?? $user->email) : 'staf_persuratan';
        $ip = $request->ip() ?: '127.0.0.1';
        $now = Carbon::now();

        Log::info("AUDIT TRAIL: Pratinjau berkas digital nomor {$arsip->no_surat} dibuka oleh {$accountName} (IP: {$ip}).");

        AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $user->user_id ?? (string) Str::uuid(),
            'action' => 'VIEW_ARSIP',
            'target_entity' => 'arsip:' . $arsip->id,
            'ip_address' => $ip,
            'reason' => 'Pratinjau dokumen: ' . $arsip->no_surat,
            'timestamp' => $now,
        ]);

        if (!Storage::disk('public')->exists($arsip->file_path)) {
            return response()->json(['message' => 'Berkas digital tidak ditemukan di server penyimpanan.'], 404);
        }

        $fullPath = Storage::disk('public')->path($arsip->file_path);
        $extension = strtolower(pathinfo($arsip->file_path, PATHINFO_EXTENSION));
        $cleanFileName = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $arsip->no_surat) . '.' . $extension;

        if ($extension === 'pdf') {
            $watermarkService = app(\App\Services\WatermarkService::class);
            $watermarkedContent = $watermarkService->applyDynamicWatermark(
                $fullPath,
                $accountName,
                $ip,
                $now
            );

            return response($watermarkedContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $cleanFileName . '"',
                'Content-Length' => strlen($watermarkedContent),
                'Cache-Control' => 'no-cache, private',
            ]);
        }

        $mime = Storage::disk('public')->mimeType($arsip->file_path) ?: 'application/octet-stream';

        return response()->file($fullPath, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . basename($arsip->file_path) . '"'
        ]);
    }

    /**
     * Download dengan Dynamic Watermark & Audit
     */
    public function download(Request $request, string $id)
    {
        $arsip = Arsip::findOrFail($id);
        $user = $request->user();
        $accountName = $user ? ($user->username ?? $user->name ?? $user->email) : 'staf_persuratan';
        $ip = $request->ip() ?: '127.0.0.1';
        $now = Carbon::now();

        Log::info("AUDIT TRAIL: Dokumen {$arsip->no_surat} diunduh oleh {$accountName} dengan IP {$ip}. Dynamic Watermark diaplikasikan.");

        AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $user->user_id ?? (string) Str::uuid(),
            'action' => 'DOWNLOAD_ARSIP',
            'target_entity' => 'arsip:' . $arsip->id,
            'ip_address' => $ip,
            'reason' => 'Download dokumen: ' . $arsip->no_surat,
            'timestamp' => $now,
        ]);

        if (!Storage::disk('public')->exists($arsip->file_path)) {
            return response()->json(['message' => 'File tidak ditemukan di server.'], 404);
        }

        $fullPath = Storage::disk('public')->path($arsip->file_path);
        $extension = strtolower(pathinfo($arsip->file_path, PATHINFO_EXTENSION));
        $cleanFileName = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $arsip->no_surat) . '.' . $extension;

        if ($extension === 'pdf') {
            $watermarkService = app(\App\Services\WatermarkService::class);
            $watermarkedContent = $watermarkService->applyDynamicWatermark(
                $fullPath,
                $accountName,
                $ip,
                $now
            );

            return response($watermarkedContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $cleanFileName . '"',
                'Content-Length' => strlen($watermarkedContent),
                'Cache-Control' => 'no-cache, private',
            ]);
        }

        return response()->download($fullPath, $cleanFileName);
    }

    /**
     * Eksekusi Soft Delete Berkas Arsip
     */
    public function destroy(Request $request, string $id)
    {
        abort_if(str_contains(strtolower($request->user()->role), 'tamu'), 403);
        abort_unless(\App\Support\C1Access::leadership($request->user()) || preg_match('/kordiv|kadiv|kepala divisi|kasubag|kabag/i', $request->user()->role), 403);
        $request->validate([
            'alasan_penghapusan' => 'required|string|min:10'
        ]);

        $arsip = Arsip::findOrFail($id);
        
        $arsip->update([
            'is_deleted' => true,
            'alasan_penghapusan' => $request->alasan_penghapusan
        ]);

        $arsip->delete(); // Soft delete eksekusi

        Log::info("AUDIT TRAIL: Dokumen ID {$id} telah dihapus (Soft Delete) oleh {$request->user()->username}. Alasan: {$request->alasan_penghapusan}");

        AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $request->user()->user_id,
            'action' => 'DELETE_ARSIP',
            'target_entity' => 'arsip:' . $arsip->id,
            'ip_address' => $request->ip(),
            'reason' => 'Hapus dokumen: ' . $arsip->no_surat . ' (' . $request->alasan_penghapusan . ')',
            'timestamp' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen berhasil dihapus dari peredaran publik (Soft Delete).'
        ], 200);
    }

    public function logs(Request $request)
    {
        $logs = AuditLog::with('user')
            ->whereIn('action', ['UPLOAD_ARSIP', 'DOWNLOAD_ARSIP', 'EDIT_ARSIP', 'DELETE_ARSIP', 'VIEW_ARSIP'])
            ->orderBy('timestamp', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs
        ], 200);
    }
}
