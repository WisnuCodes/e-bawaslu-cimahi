<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wilayah_tps', function (Blueprint $table) {
            $table->uuid('tps_id')->primary();
            $table->string('kecamatan', 100);
            $table->string('kelurahan', 100);
            $table->integer('no_tps');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wilayah_tps');
    }
};
