<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Presensi extends Model
{
    protected $table = 'presensi_wfh';
    protected $primaryKey = 'presensi_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // We use custom timestamps for check-in/out, wait ERD doesn't have created_at? No, ERD has no created_at for presensi_wfh.

    protected $fillable = [
        'presensi_id',
        'user_id',
        'timestamp_checkin',
        'selfie_masuk_url',
        'status_kehadiran',
        'timestamp_checkout',
        'selfie_keluar_url'
    ];
}
