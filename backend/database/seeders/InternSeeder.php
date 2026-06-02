<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InternSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('interns')->insert([
            [
                'first_name' => 'Fatima',
                'last_name' => 'Zahra',
                'photo' => null,
                'establishment' => 'FST Settat',
                'internship_type' => 'PFE',
                'start_date' => '2024-03-01',
                'end_date' => '2024-06-30',
                'duration' => 120,
                'supervisor_id' => 1, // Khalid Tazi
                'service' => 'Informatique',
                'shift_id' => 4, // Fixe Stagiaire
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'Mohamed',
                'last_name' => 'Amine',
                'photo' => null,
                'establishment' => 'ENSA Settat',
                'internship_type' => 'Stage d\'observation',
                'start_date' => '2024-04-01',
                'end_date' => '2024-04-30',
                'duration' => 30,
                'supervisor_id' => 1, // Khalid Tazi
                'service' => 'Informatique',
                'shift_id' => 4, // Fixe Stagiaire
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'Nadia',
                'last_name' => 'El Alaoui',
                'photo' => null,
                'establishment' => 'Université Hassan II',
                'internship_type' => 'Stage de fin d\'études',
                'start_date' => '2024-02-01',
                'end_date' => '2024-05-31',
                'duration' => 90,
                'supervisor_id' => 2, // Fatima Benali
                'service' => 'Ressources Humaines',
                'shift_id' => 4, // Fixe Stagiaire
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}