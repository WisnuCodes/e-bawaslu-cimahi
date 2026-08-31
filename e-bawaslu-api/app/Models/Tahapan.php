<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Tahapan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'tahapan';
    
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'divisi_id',
        'nama_tahapan'
    ];

    public function divisi()
    {
        return $this->belongsTo(Divisi::class, 'divisi_id', 'divisi_id');
    }
}
