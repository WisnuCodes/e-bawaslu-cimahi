<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('berkas_c1', function (Blueprint $table) {
            $table->uuid('c1_id')->primary();
            $table->uuid('tps_id');
            $table->uuid('uploaded_by');
            $table->integer('total_suara_sah')->nullable();
            $table->integer('total_suara_tidak_sah')->nullable();
            $table->integer('total_pemilih')->nullable();
            $table->string('sha256_hash', 64)->nullable();
            $table->text('file_url')->nullable();
            $table->string('status_c1', 20)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('tps_id')->references('tps_id')->on('wilayah_tps')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('berkas_c1');
    }
};
