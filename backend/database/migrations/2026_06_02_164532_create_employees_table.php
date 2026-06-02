
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('matricule')->unique();           // EMP-XXXX
            $table->string('full_name');                     // Nom complet
            $table->string('photo')->nullable();             // Photo
            $table->string('position');                      // Poste
            $table->string('department');                    // Département
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->date('hire_date');                       // Date d'embauche
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};