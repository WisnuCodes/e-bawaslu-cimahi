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
        Schema::table('presensi_wfh', function (Blueprint $table) {
            $table->string('tipe_kehadiran')->nullable()->after('status_co');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('presensi_wfh', function (Blueprint $table) {
            $table->dropColumn('tipe_kehadiran');
        });
    }
};
