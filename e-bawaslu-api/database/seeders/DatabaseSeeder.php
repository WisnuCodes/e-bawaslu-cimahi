<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        \Illuminate\Support\Facades\DB::table('divisi')->insert([
            'divisi_id' => \Illuminate\Support\Str::uuid(),
            'nama_divisi' => 'Divisi Pengawasan',
            'deskripsi' => 'Divisi utama pengawasan lapangan',
            'created_at' => now(),
        ]);

        \Illuminate\Support\Facades\DB::table('wilayah_tps')->insert([
            'tps_id' => \Illuminate\Support\Str::uuid(),
            'kecamatan' => 'Cimahi Tengah',
            'kelurahan' => 'Cimahi',
            'no_tps' => 1,
        ]);

        \Illuminate\Support\Facades\DB::table('users')->insert([
            'user_id' => \Illuminate\Support\Str::uuid(),
            'divisi_id' => \Illuminate\Support\Facades\DB::table('divisi')->first()->divisi_id,
            'username' => 'admin_bawaslu',
            'email' => 'admin@bawaslu.go.id',
            'password_hash' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'Kepala Divisi',
            'mfa_enabled' => true,
            'status_aktif' => true,
            'created_at' => now(),
        ]);
    }
}
