<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->string('pengirim')->nullable()->after('kategori');
            $table->uuid('divisi_tujuan')->nullable()->after('pengirim');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->dropColumn(['pengirim', 'divisi_tujuan']);
        });
    }
};
