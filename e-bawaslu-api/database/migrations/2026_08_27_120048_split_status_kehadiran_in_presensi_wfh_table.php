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
            $table->renameColumn('status_kehadiran', 'status_ci');
            $table->string('status_co', 20)->nullable()->after('status_kehadiran');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('presensi_wfh', function (Blueprint $table) {
            $table->dropColumn('status_co');
            $table->renameColumn('status_ci', 'status_kehadiran');
        });
    }
};
