<?php

namespace App\Http\Resources\C1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class C1Resource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->c1_id,
            'tps_id' => $this->tps_id,
            'uploaded_by' => $this->uploaded_by,
            'total_suara_sah' => $this->total_suara_sah,
            'total_suara_tidak_sah' => $this->total_suara_tidak_sah,
            'total_pemilih' => $this->total_pemilih,
            'suara_paslon' => $this->suara_paslon ? json_decode($this->suara_paslon, true) : null,
            'sha256_hash' => $this->sha256_hash,
            'file_url' => $this->file_url ? url('storage/' . $this->file_url) : null,
            'status_c1' => $this->status_c1,
            'created_at' => $this->created_at,
        ];
    }
}
