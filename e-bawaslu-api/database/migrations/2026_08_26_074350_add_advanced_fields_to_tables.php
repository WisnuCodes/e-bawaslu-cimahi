<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presensi_wfh', function (Blueprint $table) {
            $table->string('gps_koordinat')->nullable();
            $table->decimal('liveness_score', 3, 2)->nullable();
        });

        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->softDeletes();
            $table->string('alasan_penghapusan')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('presensi_wfh', function (Blueprint $table) {
            $table->dropColumn(['gps_koordinat', 'liveness_score']);
        });

        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn('alasan_penghapusan');
        });
    }
};
