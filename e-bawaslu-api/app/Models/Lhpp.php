<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lhpp extends Model
{
    use HasFactory;

    protected $table = 'berkas_lhpp';
    protected $primaryKey = 'lhpp_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'lhpp_id',
        'tps_id',
        'uploaded_by',
        'kamar',
        'kategori_dokumen',
        'kategori',
        'tahapan_pembimbing',
        'divisi_tujuan_id',
        'nomor_lhpp',
        'judul_laporan',
        'tanggal_pengawasan',
        'tahapan_pemilu',
        'deskripsi_pengawasan',
        'file_url',
        'file_name',
        'file_size',
        'file_type',
        'status_lhpp',
        'catatan_verifikasi',
        'verified_by',
        'verified_at',
        'ppid_hyperlink'
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pengawasan' => 'date',
            'verified_at' => 'datetime',
            'file_size' => 'integer',
        ];
    }

    public function tps()
    {
        return $this->belongsTo(WilayahTps::class, 'tps_id', 'tps_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by', 'user_id');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by', 'user_id');
    }

    public function divisiTujuan()
    {
        return $this->belongsTo(Divisi::class, 'divisi_tujuan_id', 'divisi_id');
    }
}
