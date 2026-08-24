<?php

namespace App\Http\Resources\WFH;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorklogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->worklog_id,
            'user_id' => $this->user_id,
            'tgl_kerja' => $this->tgl_kerja,
            'rincian_aktivitas' => $this->rincian_aktivitas,
            'attachment_url' => $this->attachment_url ? url('storage/' . $this->attachment_url) : null,
            'status_approval' => $this->status_approval,
            'catatan_revisi' => $this->catatan_revisi,
            'created_at' => $this->created_at,
        ];
    }
}
