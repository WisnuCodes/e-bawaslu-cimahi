<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $hidden = ['password_hash', 'otp_code', 'otp_expires_at'];

    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'string';
    const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'tps_id',
        'divisi_id',
        'username',
        'email',
        'whatsapp_number',
        'koordinat_acuan',
        'otp_code',
        'otp_expires_at',
        'password_hash',
        'role',
        'mfa_enabled',
        'status_aktif'
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
        ];
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    public function isSuperAdmin(): bool
    {
        $role = strtolower($this->role ?? '');
        return str_contains($role, 'admin') || str_contains($role, 'superadmin');
    }

    public function isPimpinan(): bool
    {
        $role = strtolower($this->role ?? '');
        return str_contains($role, 'ketua') || str_contains($role, 'pimpinan') || str_contains($role, 'koordinator sekretariat');
    }

    public function isKepalaDivisi(): bool
    {
        $role = strtolower($this->role ?? '');
        return str_contains($role, 'kordiv') || str_contains($role, 'kepala divisi') || str_contains($role, 'kasubag') || str_contains($role, 'kabag') || str_contains($role, 'bendahara');
    }

    public function isPengawasTps(): bool
    {
        $role = strtolower($this->role ?? '');
        return str_contains($role, 'pengawas tps') || str_contains($role, 'saksi') || str_contains($role, 'ptps');
    }

    public function isAdminKordiv(): bool
    {
        return $this->isSuperAdmin() || $this->isPimpinan() || $this->isKepalaDivisi();
    }

    public function isPanwascam(): bool
    {
        $role = strtolower($this->role ?? '');
        return str_contains($role, 'panwascam');
    }

    public function isPkd(): bool
    {
        $role = strtolower($this->role ?? '');
        return str_contains($role, 'pkd');
    }

    public function isPtps(): bool
    {
        return $this->isPengawasTps();
    }

    public function canAccessDocument(string $type): bool
    {
        $role = strtolower($this->role ?? '');
        $type = strtoupper($type);
        
        if ($this->isSuperAdmin()) return true;

        if ($type === 'C1') {
            return $this->isPanwascam() || $this->isPtps() || $this->isKepalaDivisi();
        }
        if ($type === 'LHP') {
            return $this->isPanwascam() || $this->isPkd() || $this->isPtps() || $this->isKepalaDivisi();
        }
        return true;
    }

    public function canManageUsers(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canAccessP2H(): bool
    {
        $role = strtolower($this->role ?? '');
        return str_contains($role, 'p2h')
            || $this->isSuperAdmin()
            || $this->isPimpinan()
            || $this->isKepalaDivisi()
            || $this->isPengawasTps()
            || !empty($this->divisi_id);
    }

    public function canDeleteLhpp(): bool
    {
        $role = strtolower($this->role ?? '');
        $isKadivP2H = str_contains($role, 'p2h') && ($this->isKepalaDivisi());
        return $this->isSuperAdmin() || $this->isPimpinan() || $isKadivP2H;
    }

    public function canAccessAuditLog(): bool
    {
        return $this->isSuperAdmin() || $this->isPimpinan() || $this->isKepalaDivisi();
    }
}
