<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tukin extends Model
{
    use HasFactory;

    protected $table = 'rekapitulasi_tukin';
    protected $primaryKey = 'rekap_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'rekap_id',
        'user_id',
        'bulan',
        'tahun',
        'total_jam_kerja',
        'total_keterlambatan',
        'akumulasi_tukin',
        'created_at'
    ];

    public $timestamps = false;

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
