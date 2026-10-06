<?php

namespace App\Http\Controllers\Api\WFH;

use App\Http\Controllers\Controller;
use App\Models\Worklog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;


class WorklogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $role = strtolower($user->role);
        
        $isAdmin = str_contains($role, 'admin');
        $isPimpinan = str_contains($role, 'ketua') || str_contains($role, 'pimpinan') || str_contains($role, 'koordinator sekretariat');
        $isKadiv = str_contains($role, 'kordiv') || str_contains($role, 'kepala divisi') || str_contains($role, 'kasubag') || str_contains($role, 'kabag');
        
        $canApprove = $isAdmin || $isPimpinan || $isKadiv;

        $query = Worklog::query()
            ->join('users', 'daily_worklog.user_id', '=', 'users.user_id')
            ->select('daily_worklog.*', 'users.username as nama_pegawai')
            ->orderBy('daily_worklog.tgl_kerja', 'desc');

        if (!$canApprove) {
            $query->where('daily_worklog.user_id', $user->user_id);
        }

        // Filter berdasarkan start_date dan end_date (jika tidak ada, ambil hari ini)
        if ($request->has('start_date') && $request->has('end_date')) {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            $query->whereDate('daily_worklog.tgl_kerja', '>=', $startDate->toDateString())
                ->whereDate('daily_worklog.tgl_kerja', '<=', $endDate->toDateString());
        } else {
            $today = Carbon::today();
            $query->whereDate('daily_worklog.tgl_kerja', $today);
        }
        
        $worklogs = $query->get();

        return response()->json([
            'success' => true,
            'data' => $worklogs
        ], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tgl_kerja' => 'required|date',
            'rincian_aktivitas' => 'required|string|max:10000',
            'file_lampiran' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048'
        ]);

        $path = null;
        if ($request->hasFile('file_lampiran')) {
            $path = $request->file('file_lampiran')->store('worklogs', 'public');
        }

        $worklog = Worklog::create([
            'worklog_id' => (string) Str::uuid(),
            'user_id' => $request->user()->user_id,
            'tgl_kerja' => $request->tgl_kerja,
            'rincian_aktivitas' => $request->rincian_aktivitas,
            'attachment_url' => $path,
            'status_approval' => 'Pending Approval',
            'created_at' => Carbon::now()
        ]);

        // MOCK: Event listener/Notification trigger to Kepala Divisi
        Log::info("Notifikasi Waktu Nyata (Real-time): Worklog baru diajukan oleh {$request->user()->username} dan menunggu persetujuan.");

        return response()->json([
            'success' => true,
            'message' => 'Worklog berhasil diajukan dan sedang Menunggu Persetujuan.',
            'data' => $worklog
        ], 201);
    }

    /**
     * Endpoint untuk Kepala Divisi menyetujui Worklog
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Approved,Revised',
            'catatan_revisi' => 'nullable|string'
        ]);

        $worklog = Worklog::findOrFail($id);
        
        // Asumsi user auth adalah Kadiv
        $worklog->update([
            'status_approval' => $request->status,
            'approved_by' => $request->user()->user_id,
            'catatan_revisi' => $request->catatan_revisi
        ]);

        if ($request->status === 'Approved') {
            Log::info("Notifikasi: Worklog ID {$id} telah disetujui.");

        }

        return response()->json([
            'success' => true,
            'message' => 'Worklog berhasil di-review.',
            'data' => $worklog
        ], 200);
    }
    
    public function update(Request $request, $id)
    {
        $request->validate([
            'tgl_kerja' => 'sometimes|required|date',
            'rincian_aktivitas' => 'required|string|max:10000',
            'file_lampiran' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048'
        ]);

        $worklog = Worklog::findOrFail($id);
        
        // Authorization: only owner or admin can update
        $user = $request->user();
        $role = strtolower($user->role);
        $isAdmin = str_contains($role, 'admin');
        $isPimpinan = str_contains($role, 'ketua') || str_contains($role, 'pimpinan') || str_contains($role, 'koordinator sekretariat');
        $isKadiv = str_contains($role, 'kordiv') || str_contains($role, 'kepala divisi') || str_contains($role, 'kasubag') || str_contains($role, 'kabag');
        $canApprove = $isAdmin || $isPimpinan || $isKadiv;

        if ($worklog->user_id !== $user->user_id && !$canApprove) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $path = $worklog->attachment_url;
        if ($request->hasFile('file_lampiran')) {
            $path = $request->file('file_lampiran')->store('worklogs', 'public');
        }

        $worklog->update([
            'tgl_kerja' => $request->input('tgl_kerja', $worklog->tgl_kerja),
            'rincian_aktivitas' => $request->rincian_aktivitas,
            'attachment_url' => $path,
            'status_approval' => 'Pending Approval' // Reset to pending after edit
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Worklog berhasil diperbarui.',
            'data' => $worklog
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $worklog = Worklog::findOrFail($id);
        
        $user = $request->user();
        $role = strtolower($user->role);
        $isAdmin = str_contains($role, 'admin');
        $isPimpinan = str_contains($role, 'ketua') || str_contains($role, 'pimpinan') || str_contains($role, 'koordinator sekretariat');
        $isKadiv = str_contains($role, 'kordiv') || str_contains($role, 'kepala divisi') || str_contains($role, 'kasubag') || str_contains($role, 'kabag');
        $canApprove = $isAdmin || $isPimpinan || $isKadiv;

        if ($worklog->user_id !== $user->user_id && !$canApprove) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $worklog->delete();

        return response()->json([
            'success' => true,
            'message' => 'Worklog berhasil dihapus.'
        ], 200);
    }
}
