// database/migrations/2024_01_01_000005_create_interns_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interns', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('photo')->nullable();
            $table->string('establishment');              // Établissement
            $table->string('internship_type');            // Type de stage
            $table->date('start_date');                   // Date début
            $table->date('end_date');                     // Date fin
            $table->integer('duration');                  // Durée en jours
            $table->foreignId('supervisor_id')->constrained('supervisors')->onDelete('cascade');
            $table->string('service');                    // Service
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interns');
    }
};