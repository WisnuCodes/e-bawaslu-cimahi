<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->json('catatan_kejadian')->nullable();
            $table->text('kondisi_kotak_surat')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('arsip_dokumen', fn (Blueprint $table) => $table->dropColumn(['catatan_kejadian', 'kondisi_kotak_surat']));
    }
};
