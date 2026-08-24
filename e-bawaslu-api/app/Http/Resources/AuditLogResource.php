<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->log_id,
            'actor_id' => $this->actor_id,
            'action' => $this->action,
            'target_entity' => $this->target_entity,
            'ip_address' => $this->ip_address,
            'reason' => $this->reason,
            'timestamp' => $this->timestamp,
        ];
    }
}
