<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Worklog extends Model
{
    protected $table = 'daily_worklog';
    protected $primaryKey = 'worklog_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // Based on ERD, only created_at is present.

    protected $fillable = [
        'worklog_id',
        'user_id',
        'approved_by',
        'tgl_kerja',
        'rincian_aktivitas',
        'attachment_url',
        'status_approval',
        'catatan_revisi',
        'created_at'
    ];
}
