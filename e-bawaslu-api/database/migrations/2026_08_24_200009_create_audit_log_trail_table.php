<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_log_trail', function (Blueprint $table) {
            $table->uuid('log_id')->primary();
            $table->uuid('actor_id')->nullable();
            $table->string('action', 50)->nullable();
            $table->string('target_entity', 100)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('reason')->nullable();
            $table->timestamp('timestamp')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_log_trail');
    }
};
