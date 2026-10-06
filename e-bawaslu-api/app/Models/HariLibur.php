<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HariLibur extends Model
{
    protected $table = 'hari_libur';

    protected $fillable = [
        'tanggal',
        'keterangan',
        'is_nasional',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'is_nasional' => 'boolean',
    ];
}
