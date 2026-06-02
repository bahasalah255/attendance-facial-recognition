// database/migrations/2024_01_01_000007_create_face_data_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('face_data', function (Blueprint $table) {
            $table->id();
            $table->morphs('user');  // user_id + user_type (Employee/Intern)
            $table->json('face_descriptors');  // Tableau des 3 vecteurs 128D
            $table->timestamp('last_scan_time')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('face_data');
    }
};