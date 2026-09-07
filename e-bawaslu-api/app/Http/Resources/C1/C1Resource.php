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
            'approval_divisi_id' => $this->approval_divisi_id,
            'kecamatan' => $this->kecamatan,
            'kelurahan' => $this->kelurahan,
            'jenis_pemilihan' => $this->jenis_pemilihan ?? 'Pemilu',
            'sub_jenis_pemilihan' => $this->sub_jenis_pemilihan,
            'tps_id' => $this->tps_id,
            'uploaded_by' => $this->uploaded_by,
            'total_suara_sah' => $this->total_suara_sah,
            'total_suara_tidak_sah' => $this->total_suara_tidak_sah,
            'total_pemilih' => $this->total_pemilih,
            'suara_paslon' => $this->suara_paslon ? json_decode($this->suara_paslon) : null,
            'sha256_hash' => $this->sha256_hash,
            'file_url' => $this->file_url ? url('api/c1/'.$this->c1_id.'/download') : null,
            'status_c1' => $this->status_c1,
            'created_at' => $this->created_at,
        ];
    }
}
