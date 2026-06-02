<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        // Présences pour aujourd'hui (employés)
        DB::table('attendance')->insert([
            // Employé 1 - Ahmed (présent)
            [
                'user_id' => 1,
                'user_type' => 'App\Models\Employee',
                'date' => date('Y-m-d'),
                'check_in' => '08:15:00',
                'check_out' => '17:30:00',
                'total_hours' => 555, // 9h15 en minutes
                'status' => 'late', // 15 min de retard
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Employé 2 - Sara (présent)
            [
                'user_id' => 2,
                'user_type' => 'App\Models\Employee',
                'date' => date('Y-m-d'),
                'check_in' => '08:00:00',
                'check_out' => '17:00:00',
                'total_hours' => 540, // 9h
                'status' => 'present',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Employé 3 - Youssef (absent aujourd'hui)
            [
                'user_id' => 3,
                'user_type' => 'App\Models\Employee',
                'date' => date('Y-m-d'),
                'check_in' => null,
                'check_out' => null,
                'total_hours' => null,
                'status' => 'absent',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Stagiaire 1 - Fatima (présente)
            [
                'user_id' => 1,
                'user_type' => 'App\Models\Intern',
                'date' => date('Y-m-d'),
                'check_in' => '08:05:00',
                'check_out' => '15:00:00',
                'total_hours' => 415, // 6h55
                'status' => 'present',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}