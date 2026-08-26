<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('version_history', function (Blueprint $table) {
            $table->renameColumn('version_id', 'history_id');
            $table->renameColumn('document_id', 'arsip_id');
            $table->renameColumn('version_number', 'version_name');
            $table->renameColumn('modified_by', 'uploaded_by');
            $table->renameColumn('modified_at', 'created_at');
            $table->text('catatan_revisi')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('version_history', function (Blueprint $table) {
            $table->renameColumn('history_id', 'version_id');
            $table->renameColumn('arsip_id', 'document_id');
            $table->renameColumn('version_name', 'version_number');
            $table->renameColumn('uploaded_by', 'modified_by');
            $table->renameColumn('created_at', 'modified_at');
            $table->dropColumn('catatan_revisi');
            $table->dropColumn('updated_at');
        });
    }
};
