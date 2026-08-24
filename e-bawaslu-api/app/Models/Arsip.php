<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Arsip extends Model
{
    protected $table = 'arsip_dokumen';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'divisi_id',
        'created_by',
        'no_surat',
        'tgl_surat',
        'perihal',
        'kategori',
        'klasifikasi',
        'file_path',
        'version',
        'is_locked',
        'is_deleted'
    ];
}
