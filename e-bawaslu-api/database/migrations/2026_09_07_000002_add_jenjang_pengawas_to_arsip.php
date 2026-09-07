<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->string('jenjang_pengawas')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('arsip_dokumen', fn (Blueprint $table) => $table->dropColumn('jenjang_pengawas'));
    }
};
