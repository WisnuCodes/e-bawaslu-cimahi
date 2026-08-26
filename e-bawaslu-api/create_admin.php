<?php

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

$divisiIT = DB::table('divisi')->where('nama_divisi', 'like', '%IT%')->first();

if (!$divisiIT) {
    echo "Divisi IT not found.\n";
    exit(1);
}

$existing = DB::table('users')->where('email', 'jefri@cimahi.bawaslu.go.id')->first();
if ($existing) {
    DB::table('users')->where('email', 'jefri@cimahi.bawaslu.go.id')->update([
        'whatsapp_number' => '085600386692',
        'password_hash' => Hash::make('password'),
        'role' => 'Super Administrator',
        'status_aktif' => true,
    ]);
    echo "User updated: jefri@cimahi.bawaslu.go.id\n";
} else {
    DB::table('users')->insert([
        'user_id' => (string) Str::uuid(),
        'divisi_id' => $divisiIT->divisi_id,
        'username' => 'Admin Jefri',
        'email' => 'jefri@cimahi.bawaslu.go.id',
        'whatsapp_number' => '085600386692',
        'password_hash' => Hash::make('password'),
        'role' => 'Super Administrator',
        'mfa_enabled' => true,
        'status_aktif' => true,
        'created_at' => now(),
    ]);
    echo "User created: jefri@cimahi.bawaslu.go.id\n";
}

echo "Done!\n";
