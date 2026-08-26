<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VersionHistory extends Model
{
    use HasFactory;

    protected $table = 'version_history';
    protected $primaryKey = 'version_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'version_id',
        'dokumen_id',
        'version_number',
        'file_path',
        'catatan_perubahan',
        'created_by'
    ];

    const UPDATED_AT = null;

    public function arsip()
    {
        return $this->belongsTo(Arsip::class, 'dokumen_id', 'id');
    }
}
