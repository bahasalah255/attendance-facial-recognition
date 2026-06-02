// database/migrations/2024_01_01_000008_create_anomalies_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anomalies', function (Blueprint $table) {
            $table->id();
            $table->morphs('user');  // user_id + user_type (Employee/Intern)
            $table->date('date');
            $table->enum('type', [
                'late',
                'early_departure',
                'absence',
                'forgot_checkin',
                'forgot_checkout',
                'insufficient_hours',
                'out_of_schedule'
            ]);
            $table->text('details')->nullable();
            $table->boolean('resolved')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anomalies');
    }
};