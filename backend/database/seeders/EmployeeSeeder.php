<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('employees')->insert([
            [
                'matricule' => 'EMP-0001',
                'full_name' => 'Ahmed Benali',
                'photo' => null,
                'position' => 'Développeur Full Stack',
                'department' => 'Informatique',
                'shift_id' => 1, // Matin
                'hire_date' => '2024-01-15',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'matricule' => 'EMP-0002',
                'full_name' => 'Sara Ouazzani',
                'photo' => null,
                'position' => 'Chef de Projet',
                'department' => 'Informatique',
                'shift_id' => 1, // Matin
                'hire_date' => '2023-06-01',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'matricule' => 'EMP-0003',
                'full_name' => 'Youssef Merzouk',
                'photo' => null,
                'position' => 'Commercial',
                'department' => 'Commercial',
                'shift_id' => 2, // Soir
                'hire_date' => '2024-02-10',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'matricule' => 'EMP-0004',
                'full_name' => 'Leila Chafik',
                'photo' => null,
                'position' => 'Agent de sécurité',
                'department' => 'Sécurité',
                'shift_id' => 3, // Nuit
                'hire_date' => '2024-01-20',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'matricule' => 'EMP-0005',
                'full_name' => 'Rachid Amrani',
                'photo' => null,
                'position' => 'Comptable',
                'department' => 'Finance',
                'shift_id' => 1, // Matin
                'hire_date' => '2023-11-01',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}