<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Lhp extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'lhp';
    
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'divisi_id',
        'tahapan_id',
        'jenis_pemilihan',
        'sub_jenis_pemilihan',
        'uraian_hasil',
        'bukti_dokumen',
        'status',
        'kejadian_khusus',
        'kondisi_kotak_surat'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function divisi()
    {
        return $this->belongsTo(Divisi::class, 'divisi_id', 'divisi_id');
    }

    public function tahapan()
    {
        return $this->belongsTo(Tahapan::class, 'tahapan_id', 'id');
    }
}
