<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_worklog', function (Blueprint $table) {
            $table->uuid('worklog_id')->primary();
            $table->uuid('user_id');
            $table->uuid('approved_by')->nullable();
            $table->date('tgl_kerja')->nullable();
            $table->text('rincian_aktivitas')->nullable();
            $table->text('attachment_url')->nullable();
            $table->string('status_approval', 20)->nullable();
            $table->text('catatan_revisi')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_worklog');
    }
};
