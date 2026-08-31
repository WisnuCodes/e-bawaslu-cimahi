<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class C1 extends Model
{
    protected $table = 'berkas_c1';
    protected $primaryKey = 'c1_id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false; // Based on ERD, only created_at is present.

    protected $fillable = [
        'c1_id',
        'tps_id',
        'approval_divisi_id',
        'uploaded_by',
        'total_suara_sah',
        'total_suara_tidak_sah',
        'total_pemilih',
        'sha256_hash',
        'file_url',
        'status_c1',
        'jenis_pemilihan',
        'sub_jenis_pemilihan',
        'created_at'
    ];
}
