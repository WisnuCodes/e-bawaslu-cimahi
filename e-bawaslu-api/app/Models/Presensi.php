<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Presensi extends Model
{
    protected $table = 'presensi_wfh';
    protected $primaryKey = 'presensi_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; 

    protected $fillable = [
        'presensi_id',
        'user_id',
        'timestamp_checkin',
        'selfie_masuk_url',
        'status_ci',
        'status_co',
        'timestamp_checkout',
        'selfie_keluar_url',
        'gps_koordinat',
        'liveness_score'
    ];
}
