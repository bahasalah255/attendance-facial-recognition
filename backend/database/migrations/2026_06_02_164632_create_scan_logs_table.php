// database/migrations/2024_01_01_000009_create_scan_logs_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scan_logs', function (Blueprint $table) {
            $table->id();
            $table->string('user_identifier');  // matricule ou nom complet
            $table->boolean('accepted');
            $table->string('rejection_reason')->nullable();
            $table->dateTime('scan_time');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scan_logs');
    }
};