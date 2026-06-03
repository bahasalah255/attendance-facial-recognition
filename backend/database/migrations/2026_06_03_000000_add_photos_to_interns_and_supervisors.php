<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interns', function (Blueprint $table) {
            if (!Schema::hasColumn('interns', 'photos')) {
                $table->json('photos')->nullable();
            }
        });

        Schema::table('supervisors', function (Blueprint $table) {
            if (!Schema::hasColumn('supervisors', 'photo')) {
                $table->string('photo')->nullable();
            }
            if (!Schema::hasColumn('supervisors', 'photos')) {
                $table->json('photos')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('interns', function (Blueprint $table) {
            if (Schema::hasColumn('interns', 'photos')) {
                $table->dropColumn('photos');
            }
        });

        Schema::table('supervisors', function (Blueprint $table) {
            if (Schema::hasColumn('supervisors', 'photo')) {
                $table->dropColumn('photo');
            }
            if (Schema::hasColumn('supervisors', 'photos')) {
                $table->dropColumn('photos');
            }
        });
    }
};
