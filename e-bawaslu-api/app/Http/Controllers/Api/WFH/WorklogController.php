<?php

namespace App\Http\Controllers\Api\WFH;

use App\Http\Controllers\Controller;
use App\Models\Worklog;
use App\Http\Requests\WFH\StoreWorklogRequest;
use App\Http\Requests\WFH\UpdateWorklogRequest;
use App\Http\Resources\WFH\WorklogResource;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Http\Request;

class WorklogController extends Controller
{
    /**
     * Get all worklogs for current user
     */
    public function index(Request $request)
    {
        $userId = $request->user()->user_id;
        $worklogs = Worklog::where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return WorklogResource::collection($worklogs);
    }

    /**
     * Store a newly created worklog in storage.
     */
    public function store(StoreWorklogRequest $request)
    {
        $userId = $request->user()->user_id;

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('worklogs', 'public');
        }

        $worklog = Worklog::create([
            'worklog_id' => (string) Str::uuid(),
            'user_id' => $userId,
            'tgl_kerja' => $request->tgl_kerja,
            'rincian_aktivitas' => $request->rincian_aktivitas,
            'attachment_url' => $path,
            'status_approval' => 'Pending',
            'created_at' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Worklog berhasil disimpan.',
            'data' => new WorklogResource($worklog)
        ], 201);
    }

    /**
     * Update the specified worklog in storage.
     */
    public function update(UpdateWorklogRequest $request, $id)
    {
        $worklog = Worklog::findOrFail($id);

        $path = $worklog->attachment_url;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('worklogs', 'public');
        }

        $worklog->update([
            'rincian_aktivitas' => $request->rincian_aktivitas ?? $worklog->rincian_aktivitas,
            'attachment_url' => $path,
        ]);

        return response()->json([
            'message' => 'Worklog berhasil diperbarui.',
            'data' => new WorklogResource($worklog)
        ], 200);
    }
}
