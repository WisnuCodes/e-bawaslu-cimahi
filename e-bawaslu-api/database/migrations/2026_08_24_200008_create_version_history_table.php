<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('version_history', function (Blueprint $table) {
            $table->uuid('version_id')->primary();
            $table->uuid('document_id');
            $table->string('version_number', 10)->nullable();
            $table->text('file_path')->nullable();
            $table->uuid('modified_by')->nullable();
            $table->timestamp('modified_at')->nullable();

            $table->foreign('document_id')->references('id')->on('arsip_dokumen')->onDelete('cascade');
            $table->foreign('modified_by')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('version_history');
    }
};
