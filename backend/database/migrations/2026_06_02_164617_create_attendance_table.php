// database/migrations/2024_01_01_000006_create_attendance_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->morphs('user');  // user_id + user_type (Employee/Intern)
            $table->date('date');
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->integer('total_hours')->nullable();  // en minutes
            $table->enum('status', ['present', 'absent', 'late', 'early_departure'])->default('present');
            $table->timestamps();
            
            $table->unique(['user_id', 'user_type', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};