<?php

namespace App\Http\Resources\Arsip;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArsipResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'divisi_id' => $this->divisi_id,
            'created_by' => $this->created_by,
            'no_surat' => $this->no_surat,
            'tgl_surat' => $this->tgl_surat,
            'perihal' => $this->perihal,
            'kategori' => $this->kategori,
            'klasifikasi' => $this->klasifikasi,
            'file_path' => $this->file_path ? url('storage/' . $this->file_path) : null,
            'version' => $this->version,
            'is_locked' => $this->is_locked,
            'created_at' => $this->created_at,
        ];
    }
}
