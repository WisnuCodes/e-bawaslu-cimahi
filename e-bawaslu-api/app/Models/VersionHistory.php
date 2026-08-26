<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VersionHistory extends Model
{
    use HasFactory;

    protected $table = 'version_history';
    protected $primaryKey = 'history_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'history_id',
        'arsip_id',
        'version_name',
        'file_path',
        'catatan_revisi',
        'uploaded_by'
    ];

    public function arsip()
    {
        return $this->belongsTo(Arsip::class, 'arsip_id', 'id');
    }
}
