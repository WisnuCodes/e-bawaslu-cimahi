<?php

namespace App\Http\Resources\WFH;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PresensiResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->presensi_id,
            'user_id' => $this->user_id,
            'timestamp_checkin' => $this->timestamp_checkin,
            'selfie_masuk_url' => url('storage/' . $this->selfie_masuk_url),
            'status_ci' => $this->status_ci,
            'status_co' => $this->status_co,
            'timestamp_checkout' => $this->timestamp_checkout,
            'selfie_keluar_url' => $this->selfie_keluar_url ? url('storage/' . $this->selfie_keluar_url) : null,
        ];
    }
}
