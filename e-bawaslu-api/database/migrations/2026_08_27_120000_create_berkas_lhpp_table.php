<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('berkas_lhpp', function (Blueprint $table) {
            $table->uuid('lhpp_id')->primary();
            $table->uuid('tps_id')->nullable();
            $table->uuid('uploaded_by');
            $table->string('nomor_lhpp', 100);
            $table->string('judul_laporan', 255);
            $table->date('tanggal_pengawasan');
            $table->string('tahapan_pemilu', 100);
            $table->text('deskripsi_pengawasan');
            $table->text('file_url');
            $table->string('file_name', 255);
            $table->bigInteger('file_size')->nullable();
            $table->string('file_type', 50)->nullable();
            $table->string('status_lhpp', 30)->default('Submitted'); // Draft, Submitted, Verified, Rejected
            $table->text('catatan_verifikasi')->nullable();
            $table->uuid('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->foreign('tps_id')->references('tps_id')->on('wilayah_tps')->onDelete('set null');
            $table->foreign('uploaded_by')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('verified_by')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('berkas_lhpp');
    }
};
