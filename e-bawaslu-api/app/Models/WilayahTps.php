<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WilayahTps extends Model
{
    use HasFactory;

    protected $table = 'wilayah_tps';
    protected $primaryKey = 'tps_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'tps_id',
        'nama_tps',
        'kelurahan',
        'kecamatan',
        'koordinat_lokasi'
    ];
}
