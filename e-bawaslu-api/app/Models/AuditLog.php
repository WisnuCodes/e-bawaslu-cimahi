<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_log_trail';
    protected $primaryKey = 'log_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // Only timestamp field is present in schema

    protected $fillable = [
        'log_id',
        'actor_id',
        'action',
        'target_entity',
        'ip_address',
        'reason',
        'timestamp'
    ];
}
