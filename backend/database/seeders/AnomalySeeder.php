<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnomalySeeder extends Seeder
{
    public function run(): void
    {
        DB::table('anomalies')->insert([
            // Anomalie: retard pour Ahmed aujourd'hui
            [
                'user_id' => 1,
                'user_type' => 'App\Models\Employee',
                'date' => date('Y-m-d'),
                'type' => 'late',
                'details' => 'Retard de 15 minutes (arrivée à 08:15 au lieu de 08:00)',
                'resolved' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Anomalie: absence pour Youssef aujourd'hui
            [
                'user_id' => 3,
                'user_type' => 'App\Models\Employee',
                'date' => date('Y-m-d'),
                'type' => 'absence',
                'details' => 'Absent toute la journée sans justification',
                'resolved' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Anomalie: oubli de Check-Out hier
            [
                'user_id' => 2,
                'user_type' => 'App\Models\Employee',
                'date' => date('Y-m-d', strtotime('-1 day')),
                'type' => 'forgot_checkout',
                'details' => 'Check-In à 08:00 mais pas de Check-Out enregistré',
                'resolved' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}