<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('user_id')->primary();
            $table->uuid('divisi_id')->nullable();
            $table->string('username', 50);
            $table->string('email', 100)->unique();
            $table->string('password_hash', 255);
            $table->string('role', 30);
            $table->boolean('mfa_enabled')->default(false);
            $table->boolean('status_aktif')->default(true);
            $table->timestamp('created_at')->nullable();

            $table->foreign('divisi_id')->references('divisi_id')->on('divisi')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
