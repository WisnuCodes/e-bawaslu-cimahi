<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lhp', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('divisi_id');
            $table->uuid('tahapan_id');
            $table->enum('jenis_pemilihan', ['Pemilu', 'Pilkada']);
            $table->string('sub_jenis_pemilihan')->nullable();
            $table->text('uraian_hasil')->nullable();
            $table->string('bukti_dokumen')->nullable();
            $table->string('status', 50)->default('Draft');
            $table->timestamps();

            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('divisi_id')->references('divisi_id')->on('divisi')->onDelete('cascade');
            $table->foreign('tahapan_id')->references('id')->on('tahapan')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lhp');
    }
};
