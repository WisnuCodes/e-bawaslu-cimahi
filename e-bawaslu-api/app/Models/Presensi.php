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
        'tipe_kehadiran',
        'timestamp_checkout',
        'selfie_keluar_url',
        'gps_koordinat',
        'liveness_score',
        'keterangan_izin',
        'lampiran_izin'
    ];

    protected $casts = [
        'timestamp_checkin' => 'datetime',
        'timestamp_checkout' => 'datetime'
    ];

    /**
     * Calculate distance between two coordinates using Haversine formula and check if within radius.
     */
    public static function isWithinGeofence($lat1, $lon1, $lat2, $lon2, $maxRadius = 1000): bool
    {
        $earthRadius = 6371000; // meters

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = $earthRadius * $c;

        return $distance <= $maxRadius;
    }
}
