<?php

namespace App\Http\Controllers\Api\P2H;

use App\Http\Controllers\Controller;
use App\Models\Lhpp;
use App\Models\WilayahTps;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class LhppController extends Controller
{
    /**
     * Tampilkan daftar dokumen LHPP (Laporan Hasil Pengawasan Pemilu)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->canAccessP2H()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengakses modul P2H.'
            ], 403);
        }

        $query = Lhpp::with([
            'tps:tps_id,no_tps,kelurahan,kecamatan',
            'uploader:user_id,username,email,role',
            'verifier:user_id,username,email,role'
        ]);

        // Pembatasan data khusus Pengawas TPS (hanya entri TPS milik sendiri)
        if ($user->isPengawasTps()) {
            if ($user->tps_id) {
                $query->where(function ($q) use ($user) {
                    $q->where('tps_id', $user->tps_id)
                      ->orWhere('uploaded_by', $user->user_id);
                });
            } else {
                $query->where('uploaded_by', $user->user_id);
            }
        }

        // Filter TPS
        if ($request->filled('tps_id')) {
            $query->where('tps_id', $request->tps_id);
        }

        // Filter Status
        if ($request->filled('status')) {
            $query->where('status_lhpp', $request->status);
        }

        // Filter Tahapan
        if ($request->filled('tahapan')) {
            $query->where('tahapan_pemilu', $request->tahapan);
        }

        // Search Keyword
        if ($request->filled('search')) {
            $keyword = $request->search;
            $query->where(function ($q) use ($keyword) {
                $q->where('judul_laporan', 'like', "%{$keyword}%")
                  ->orWhere('nomor_lhpp', 'like', "%{$keyword}%")
                  ->orWhere('deskripsi_pengawasan', 'like', "%{$keyword}%");
            });
        }

        $data = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar dokumen LHPP berhasil diambil.',
            'data' => $data
        ], 200);
    }

    /**
     * Simpan / Unggah Dokumen LHPP baru
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->canAccessP2H()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Anda tidak memiliki hak akses unggah dokumen P2H.'
            ], 403);
        }

        $request->validate([
            'judul_laporan' => 'required|string|max:255',
            'nomor_lhpp' => 'nullable|string|max:100',
            'tps_id' => 'required|uuid|exists:wilayah_tps,tps_id',
            'tanggal_pengawasan' => 'required|date',
            'tahapan_pemilu' => 'required|string|max:100',
            'deskripsi_pengawasan' => 'required|string',
            'status_lhpp' => 'nullable|in:Draft,Submitted',
            'file_dokumen' => 'required|file|mimes:pdf,jpeg,png,jpg|max:15360',
        ]);

        $tpsId = $request->tps_id;

        // Jika Pengawas TPS memiliki tps_id terikat, pastikan menggunakan tps miliknya
        if ($user->isPengawasTps() && $user->tps_id) {
            $tpsId = $user->tps_id;
        }

        $file = $request->file('file_dokumen');
        $extension = $file->getClientOriginalExtension();
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $mimeType = $file->getClientMimeType();

        $filename = 'lhpp_' . Str::uuid() . '.' . $extension;
        $path = $file->storeAs('lhpp_uploads', $filename, 'public');

        // Generate nomor LHPP jika kosong
        $nomorLhpp = $request->nomor_lhpp;
        if (empty($nomorLhpp)) {
            $count = Lhpp::whereYear('created_at', Carbon::now()->year)->count() + 1;
            $nomorLhpp = sprintf('LHPP/%s/%s/%04d', Carbon::now()->year, Carbon::now()->format('m'), $count);
        }

        $status = $request->status_lhpp ?? 'Submitted';

        $lhpp = Lhpp::create([
            'lhpp_id' => (string) Str::uuid(),
            'tps_id' => $tpsId,
            'uploaded_by' => $user->user_id,
            'nomor_lhpp' => $nomorLhpp,
            'judul_laporan' => $request->judul_laporan,
            'tanggal_pengawasan' => $request->tanggal_pengawasan,
            'tahapan_pemilu' => $request->tahapan_pemilu,
            'deskripsi_pengawasan' => $request->deskripsi_pengawasan,
            'file_url' => 'lhpp_uploads/' . $filename,
            'file_name' => $originalName,
            'file_size' => $fileSize,
            'file_type' => $mimeType,
            'status_lhpp' => $status,
        ]);

        $lhpp->load([
            'tps:tps_id,no_tps,kelurahan,kecamatan',
            'uploader:user_id,username,email,role'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen LHPP berhasil diunggah dan disimpan.',
            'data' => $lhpp
        ], 201);
    }

    /**
     * Tampilkan detail dokumen LHPP
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->canAccessP2H()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $lhpp = Lhpp::with([
            'tps:tps_id,no_tps,kelurahan,kecamatan',
            'uploader:user_id,username,email,role',
            'verifier:user_id,username,email,role'
        ])->findOrFail($id);

        if ($user->isPengawasTps()) {
            if ($user->tps_id && $lhpp->tps_id !== $user->tps_id && $lhpp->uploaded_by !== $user->user_id) {
                return response()->json(['success' => false, 'message' => 'Akses Ditolak'], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $lhpp
        ], 200);
    }

    /**
     * Edit / Perbarui data dokumen LHPP
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $lhpp = Lhpp::findOrFail($id);

        if (!$user->canAccessP2H()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Pengawas TPS hanya boleh mengedit dokumen miliknya dan selama belum 'Verified'
        if ($user->isPengawasTps()) {
            if ($lhpp->uploaded_by !== $user->user_id && ($user->tps_id && $lhpp->tps_id !== $user->tps_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses Ditolak: Anda hanya dapat mengubah berkas pengawasan TPS Anda sendiri.'
                ], 403);
            }

            if ($lhpp->status_lhpp === 'Verified') {
                return response()->json([
                    'success' => false,
                    'message' => 'Dokumen LHPP ini sudah divalidasi/disetujui dan tidak dapat diubah kembali.'
                ], 422);
            }
        }

        $request->validate([
            'judul_laporan' => 'required|string|max:255',
            'nomor_lhpp' => 'nullable|string|max:100',
            'tps_id' => 'required|uuid|exists:wilayah_tps,tps_id',
            'tanggal_pengawasan' => 'required|date',
            'tahapan_pemilu' => 'required|string|max:100',
            'deskripsi_pengawasan' => 'required|string',
            'status_lhpp' => 'nullable|in:Draft,Submitted,Verified,Rejected',
            'file_dokumen' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:15360',
        ]);

        $tpsId = $request->tps_id;
        if ($user->isPengawasTps() && $user->tps_id) {
            $tpsId = $user->tps_id;
        }

        $updateData = [
            'tps_id' => $tpsId,
            'judul_laporan' => $request->judul_laporan,
            'tanggal_pengawasan' => $request->tanggal_pengawasan,
            'tahapan_pemilu' => $request->tahapan_pemilu,
            'deskripsi_pengawasan' => $request->deskripsi_pengawasan,
        ];

        if ($request->filled('nomor_lhpp')) {
            $updateData['nomor_lhpp'] = $request->nomor_lhpp;
        }

        if ($request->filled('status_lhpp')) {
            // Pengawas TPS tidak bisa langsung mengubah status ke Verified
            if ($user->isPengawasTps() && in_array($request->status_lhpp, ['Verified', 'Rejected'])) {
                $updateData['status_lhpp'] = 'Submitted';
            } else {
                $updateData['status_lhpp'] = $request->status_lhpp;
            }
        }

        // Handle Penggantian Berkas
        if ($request->hasFile('file_dokumen')) {
            $file = $request->file('file_dokumen');
            $extension = $file->getClientOriginalExtension();
            $originalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $mimeType = $file->getClientMimeType();

            // Hapus file lama jika ada
            if ($lhpp->file_url && Storage::disk('public')->exists($lhpp->file_url)) {
                Storage::disk('public')->delete($lhpp->file_url);
            }

            $filename = 'lhpp_' . Str::uuid() . '.' . $extension;
            $file->storeAs('lhpp_uploads', $filename, 'public');

            $updateData['file_url'] = 'lhpp_uploads/' . $filename;
            $updateData['file_name'] = $originalName;
            $updateData['file_size'] = $fileSize;
            $updateData['file_type'] = $mimeType;
        }

        $lhpp->update($updateData);

        $lhpp->load([
            'tps:tps_id,no_tps,kelurahan,kecamatan',
            'uploader:user_id,username,email,role',
            'verifier:user_id,username,email,role'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen LHPP berhasil diperbarui.',
            'data' => $lhpp
        ], 200);
    }

    /**
     * Verifikasi Dokumen LHPP (Disetujui / Ditolak) oleh Admin & Kordiv
     */
    public function verify(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->isSuperAdmin() && !$user->isAdminKordiv()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Hanya Administrator dan Kordiv yang berhak melakukan verifikasi dokumen LHPP.'
            ], 403);
        }

        $request->validate([
            'status' => 'required|in:Verified,Rejected,Draft,Submitted',
            'catatan_verifikasi' => 'nullable|string',
        ]);

        $lhpp = Lhpp::findOrFail($id);
        $lhpp->update([
            'status_lhpp' => $request->status,
            'catatan_verifikasi' => $request->catatan_verifikasi,
            'verified_by' => $user->user_id,
            'verified_at' => Carbon::now(),
        ]);

        $lhpp->load([
            'tps:tps_id,no_tps,kelurahan,kecamatan',
            'uploader:user_id,username,email,role',
            'verifier:user_id,username,email,role'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status dokumen LHPP berhasil diperbarui menjadi ' . $request->status,
            'data' => $lhpp
        ], 200);
    }

    /**
     * Hapus Dokumen LHPP (DILARANG UNTUK PENGAWAS TPS)
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        // STRICT RBAC: Pengawas TPS TIDAK BOLEH menghapus data
        if ($user->isPengawasTps()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Pengawas TPS tidak memiliki hak akses untuk menghapus dokumen LHPP.'
            ], 403);
        }

        if (!$user->canDeleteLhpp()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses Ditolak: Anda tidak memiliki izin untuk menghapus dokumen LHPP.'
            ], 403);
        }

        $lhpp = Lhpp::findOrFail($id);

        if ($lhpp->file_url && Storage::disk('public')->exists($lhpp->file_url)) {
            Storage::disk('public')->delete($lhpp->file_url);
        }

        $lhpp->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dokumen LHPP berhasil dihapus permanen.'
        ], 200);
    }

    /**
     * Download Berkas Dokumen LHPP
     */
    public function download(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->canAccessP2H()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $lhpp = Lhpp::findOrFail($id);

        if (!$lhpp->file_url || !Storage::disk('public')->exists($lhpp->file_url)) {
            return response()->json([
                'success' => false,
                'message' => 'Berkas dokumen tidak ditemukan di server penyimpanan.'
            ], 404);
        }

        $filePath = Storage::disk('public')->path($lhpp->file_url);
        return response()->download($filePath, $lhpp->file_name ?: basename($lhpp->file_url));
    }
}
