<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah kolom klasifikasi_personel di arsip_dokumen
        if (!Schema::hasColumn('arsip_dokumen', 'klasifikasi_personel')) {
            Schema::table('arsip_dokumen', function (Blueprint $table) {
                $table->string('klasifikasi_personel', 50)->nullable()->after('klasifikasi');
            });
        }

        // Tambah kolom jenis_pemilihan di arsip_dokumen untuk filter kamar
        if (!Schema::hasColumn('arsip_dokumen', 'jenis_pemilihan')) {
            Schema::table('arsip_dokumen', function (Blueprint $table) {
                $table->enum('jenis_pemilihan', ['Pemilu', 'Pilkada'])->nullable()->after('klasifikasi_personel');
            });
        }

        // Update lhp: tambah batasan kejadian khusus max 3
        if (Schema::hasTable('lhp') && !Schema::hasColumn('lhp', 'urutan_kejadian')) {
            Schema::table('lhp', function (Blueprint $table) {
                $table->unsignedTinyInteger('urutan_kejadian')->nullable()->after('kondisi_kotak_surat');
            });
        }
    }

    public function down(): void
    {
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->dropColumn(['klasifikasi_personel', 'jenis_pemilihan']);
        });

        Schema::table('lhp', function (Blueprint $table) {
            $table->dropColumn('urutan_kejadian');
        });
    }
};
