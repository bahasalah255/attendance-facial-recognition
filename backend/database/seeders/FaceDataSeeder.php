<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FaceDataSeeder extends Seeder
{
    public function run(): void
    {
        // Vecteurs factices (dans la réalité, ce sont des vecteurs 128D)
        $fakeDescriptors = json_encode([
            array_fill(0, 128, 0.123),
            array_fill(0, 128, 0.456),
            array_fill(0, 128, 0.789),
        ]);

        DB::table('face_data')->insert([
            // Employé 1
            [
                'user_id' => 1,
                'user_type' => 'App\Models\Employee',
                'face_descriptors' => $fakeDescriptors,
                'last_scan_time' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Employé 2
            [
                'user_id' => 2,
                'user_type' => 'App\Models\Employee',
                'face_descriptors' => $fakeDescriptors,
                'last_scan_time' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Stagiaire 1
            [
                'user_id' => 1,
                'user_type' => 'App\Models\Intern',
                'face_descriptors' => $fakeDescriptors,
                'last_scan_time' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}