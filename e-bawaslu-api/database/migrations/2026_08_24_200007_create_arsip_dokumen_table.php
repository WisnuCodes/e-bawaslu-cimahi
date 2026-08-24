<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('arsip_dokumen', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('divisi_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->string('no_surat', 100)->nullable();
            $table->date('tgl_surat')->nullable();
            $table->string('perihal', 255)->nullable();
            $table->string('kategori', 50)->nullable();
            $table->string('klasifikasi', 50)->nullable();
            $table->text('file_path')->nullable();
            $table->string('version', 10)->nullable();
            $table->boolean('is_locked')->default(false);
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('created_at')->nullable();

            $table->foreign('divisi_id')->references('divisi_id')->on('divisi')->onDelete('cascade');
            $table->foreign('created_by')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arsip_dokumen');
    }
};
