<?php

namespace App\Support;

class C1Access
{
    public static function admin($user): bool
    {
        return str_contains(strtolower($user->role), 'admin');
    }

    public static function leadership($user): bool
    {
        return self::admin($user) || preg_match('/ketua|pimpinan|koordinator sekretariat/i', $user->role);
    }

    public static function read($user): bool
    {
        return self::leadership($user) || !empty($user->divisi_id) || preg_match('/p2h|panwascam|pkd|ptps|pengawas tps|saksi|kordiv|kepala divisi/i', $user->role);
    }

    public static function write($user): bool
    {
        return self::read($user) && !str_contains(strtolower($user->role), 'tamu');
    }

    public static function isKoordivP2H($user): bool
    {
        return preg_match('/p2h/i', $user->role) && preg_match('/kordiv|kadiv|kepala divisi/i', $user->role);
    }

    public static function approve($user, $c1): bool
    {
        if (!self::write($user)) return false;
        if (self::leadership($user)) return true;
        // Koordiv P2H mendapat hak approval global sama seperti Ketua/Pimpinan
        if (self::isKoordivP2H($user)) return true;
        return $c1->approval_divisi_id && $user->divisi_id === $c1->approval_divisi_id
            && preg_match('/kordiv|kadiv|kepala divisi|kasubag|kabag/i', $user->role);
    }
}
