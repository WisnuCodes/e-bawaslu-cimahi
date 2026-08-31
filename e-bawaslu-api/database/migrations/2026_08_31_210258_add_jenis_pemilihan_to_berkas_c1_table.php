<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('berkas_c1', function (Blueprint $table) {
            $table->enum('jenis_pemilihan', ['Pemilu', 'Pilkada'])->nullable()->after('status_c1');
            $table->string('sub_jenis_pemilihan')->nullable()->after('jenis_pemilihan');
        });
    }

    public function down(): void
    {
        Schema::table('berkas_c1', function (Blueprint $table) {
            $table->dropColumn(['jenis_pemilihan', 'sub_jenis_pemilihan']);
        });
    }
};
