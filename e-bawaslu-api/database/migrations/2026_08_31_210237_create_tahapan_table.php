<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tahapan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('divisi_id');
            $table->string('nama_tahapan');
            $table->timestamps();

            $table->foreign('divisi_id')->references('divisi_id')->on('divisi')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tahapan');
    }
};
