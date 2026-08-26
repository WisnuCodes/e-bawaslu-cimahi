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
        Schema::table('berkas_c1', function (Blueprint $table) {
            $table->json('suara_paslon')->nullable()->after('total_pemilih');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('berkas_c1', function (Blueprint $table) {
            $table->dropColumn('suara_paslon');
        });
    }
};
