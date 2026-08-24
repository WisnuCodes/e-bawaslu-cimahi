<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presensi_wfh', function (Blueprint $table) {
            $table->uuid('presensi_id')->primary();
            $table->uuid('user_id');
            $table->timestamp('timestamp_checkin')->nullable();
            $table->text('selfie_masuk_url')->nullable();
            $table->string('status_kehadiran', 20)->nullable();
            $table->timestamp('timestamp_checkout')->nullable();
            $table->text('selfie_keluar_url')->nullable();

            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presensi_wfh');
    }
};
