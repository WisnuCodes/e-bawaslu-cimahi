<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('ppid_url')->nullable()->after('whatsapp_number');
            $table->string('koordinat_acuan')->nullable()->after('ppid_url');
        });

        Schema::table('lhp', function (Blueprint $table) {
            $table->boolean('kejadian_khusus')->default(false)->after('status');
            $table->string('kondisi_kotak_surat')->nullable()->after('kejadian_khusus');
        });

        Schema::table('berkas_c1', function (Blueprint $table) {
            $table->uuid('approval_divisi_id')->nullable()->after('tps_id');
            $table->foreign('approval_divisi_id')->references('divisi_id')->on('divisi')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['ppid_url', 'koordinat_acuan']);
        });

        Schema::table('lhp', function (Blueprint $table) {
            $table->dropColumn(['kejadian_khusus', 'kondisi_kotak_surat']);
        });

        Schema::table('berkas_c1', function (Blueprint $table) {
            $table->dropForeign(['approval_divisi_id']);
            $table->dropColumn('approval_divisi_id');
        });
    }
};
