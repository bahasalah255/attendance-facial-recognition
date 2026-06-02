<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('shifts')->insert([
            [
                'name' => 'Matin',
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Soir',
                'start_time' => '17:00:00',
                'end_time' => '00:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Nuit',
                'start_time' => '00:00:00',
                'end_time' => '08:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Fixe Stagiaire',
                'start_time' => '08:00:00',
                'end_time' => '15:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}