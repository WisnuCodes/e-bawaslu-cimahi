<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Divisi extends Model
{
    use HasFactory;

    protected $table = 'divisi';
    protected $primaryKey = 'divisi_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'divisi_id',
        'nama_divisi',
        'deskripsi'
    ];
}
