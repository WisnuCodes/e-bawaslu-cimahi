<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add name column if not exists
            if (!Schema::hasColumn('users', 'name')) {
                $table->string('name', 255)->nullable()->after('username');
            }
            
            // Add tps_id if not exists
            if (!Schema::hasColumn('users', 'tps_id')) {
                $table->uuid('tps_id')->nullable()->after('divisi_id');
                $table->foreign('tps_id')->references('tps_id')->on('wilayah_tps')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeignIdFor('wilayah_tps');
            $table->dropColumn(['name', 'whatsapp_number', 'ppid_url', 'koordinat_acuan', 'tps_id']);
        });
    }
};
