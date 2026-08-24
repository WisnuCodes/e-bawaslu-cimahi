<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rekapitulasi_tukin', function (Blueprint $table) {
            $table->uuid('rekap_id')->primary();
            $table->uuid('user_id');
            $table->integer('bulan')->nullable();
            $table->integer('tahun')->nullable();
            $table->decimal('total_jam_kerja', 5, 2)->nullable();
            $table->integer('total_keterlambatan')->nullable();
            $table->decimal('akumulasi_tukin', 12, 2)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rekapitulasi_tukin');
    }
};
