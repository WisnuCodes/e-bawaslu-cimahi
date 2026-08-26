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

class ArsipController extends Controller
{
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
        $request->validate([
            'divisi_id' => 'required|uuid',
            'no_surat' => 'required|string',
            'tgl_surat' => 'required|date',
            'perihal' => 'required|string',
            'kategori' => 'required|string',
            'klasifikasi' => 'required|string',
            'file_dokumen' => 'required|file|mimes:pdf,doc,docx'
        ]);

        $userId = $request->user()->user_id;
        $path = $request->file('file_dokumen')->store('arsip', 'public');

        $arsip = Arsip::create([
            'id' => (string) Str::uuid(),
            'divisi_id' => $request->divisi_id,
            'created_by' => $userId,
            'no_surat' => $request->no_surat,
            'tgl_surat' => $request->tgl_surat,
            'perihal' => $request->perihal,
            'kategori' => $request->kategori,
            'klasifikasi' => $request->klasifikasi,
            'file_path' => $path,
            'version' => 'v1.0',
            'is_locked' => false,
            'is_deleted' => false,
        ]);

        AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $userId,
            'action' => 'UPLOAD_ARSIP',
            'target_entity' => 'arsip:' . $arsip->id,
            'ip_address' => $request->ip(),
            'reason' => 'Upload dokumen baru: ' . $arsip->no_surat,
            'timestamp' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Arsip berhasil disimpan (v1.0).',
            'data' => $arsip
        ], 201);
    }

    public function uploadRevisi(Request $request, $id)
    {
        $arsip = Arsip::findOrFail($id);

        if ($arsip->is_locked) {
            return response()->json(['success' => false, 'message' => 'Dokumen sedang dikunci dan tidak dapat direvisi.'], 403);
        }

        $request->validate([
            'file_dokumen' => 'required|file|mimes:pdf,doc,docx',
            'catatan_revisi' => 'required|string'
        ]);

        $userId = $request->user()->user_id;
        
        // Simpan versi lama ke history
        VersionHistory::create([
            'history_id' => (string) Str::uuid(),
            'arsip_id' => $arsip->id,
            'version_name' => $arsip->version,
            'file_path' => $arsip->file_path,
            'uploaded_by' => $userId,
            'catatan_revisi' => $request->catatan_revisi,
            'created_at' => Carbon::now()
        ]);

        // Hitung versi baru
        $currentVersion = (float) str_replace('v', '', $arsip->version);
        $newVersion = 'v' . number_format($currentVersion + 0.1, 1);

        $path = $request->file('file_dokumen')->store('arsip', 'public');

        $arsip->update([
            'version' => $newVersion,
            'file_path' => $path
        ]);

        AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $userId,
            'action' => 'EDIT_ARSIP',
            'target_entity' => 'arsip:' . $arsip->id,
            'ip_address' => $request->ip(),
            'reason' => 'Revisi dokumen (' . $newVersion . '): ' . $arsip->no_surat,
            'timestamp' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Revisi berhasil diunggah ($newVersion).",
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
     * Download dengan Dynamic Watermark & Audit
     */
    public function download(Request $request, $id)
    {
        $arsip = Arsip::findOrFail($id);
        $user = $request->user();

        // MOCK: Proses injeksi watermark (menggunakan library PDF)
        // Logika aslinya akan membuka PDF, me-render teks transparan nama pengunduh & IP, lalu mem-buffer ke response.
        Log::info("AUDIT TRAIL: Dokumen {$arsip->no_surat} diunduh oleh {$user->nama} dengan IP {$request->ip()}. Dynamic Watermark diaplikasikan.");

        AuditLog::create([
            'log_id' => (string) Str::uuid(),
            'actor_id' => $user->user_id,
            'action' => 'DOWNLOAD_ARSIP',
            'target_entity' => 'arsip:' . $arsip->id,
            'ip_address' => $request->ip(),
            'reason' => 'Download dokumen: ' . $arsip->no_surat,
            'timestamp' => Carbon::now(),
        ]);

        if (!Storage::disk('public')->exists($arsip->file_path)) {
            return response()->json(['message' => 'File tidak ditemukan di server.'], 404);
        }

        return Storage::disk('public')->download($arsip->file_path);
    }

    /**
     * Eksekusi Soft Delete Berkas Arsip
     */
    public function destroy(Request $request, $id)
    {
        $request->validate([
            'alasan_penghapusan' => 'required|string|min:10'
        ]);

        $arsip = Arsip::findOrFail($id);
        
        $arsip->update([
            'is_deleted' => true,
            'alasan_penghapusan' => $request->alasan_penghapusan
        ]);

        $arsip->delete(); // Soft delete eksekusi

        Log::info("AUDIT TRAIL: Dokumen ID {$id} telah dihapus (Soft Delete) oleh {$request->user()->nama}. Alasan: {$request->alasan_penghapusan}");

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
            ->whereIn('action', ['UPLOAD_ARSIP', 'DOWNLOAD_ARSIP', 'EDIT_ARSIP', 'DELETE_ARSIP'])
            ->orderBy('timestamp', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs
        ], 200);
    }
}
