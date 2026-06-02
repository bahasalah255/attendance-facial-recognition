<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Appeler tous les seeders dans le bon ordre
        $this->call([
            ShiftSeeder::class,        // 1. D'abord les shifts
            AdminSeeder::class,        // 2. Admin
            SupervisorSeeder::class,   // 3. Encadrants
            EmployeeSeeder::class,     // 4. Employés
            InternSeeder::class,       // 5. Stagiaires
            AttendanceSeeder::class,   // 6. Présences
            FaceDataSeeder::class,     // 7. Données faciales
            AnomalySeeder::class,      // 8. Anomalies
            ScanLogSeeder::class,      // 9. Logs
        ]);
    }
}