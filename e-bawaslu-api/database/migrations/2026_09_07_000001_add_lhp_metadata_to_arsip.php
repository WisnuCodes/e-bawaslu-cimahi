<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->string('jenis_pemilihan')->nullable();
            $table->uuid('tahapan_id')->nullable();
            $table->foreign('tahapan_id')->references('id')->on('tahapan');
        });
    }

    public function down(): void
    {
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->dropForeign(['tahapan_id']);
            $table->dropColumn(['jenis_pemilihan', 'tahapan_id']);
        });
    }
};
