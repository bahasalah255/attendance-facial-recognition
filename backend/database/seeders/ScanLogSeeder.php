<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ScanLogSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('scan_logs')->insert([
            [
                'user_identifier' => 'EMP-0001 (Ahmed Benali)',
                'accepted' => true,
                'rejection_reason' => null,
                'scan_time' => '2024-12-09 08:15:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_identifier' => 'EMP-0002 (Sara Ouazzani)',
                'accepted' => true,
                'rejection_reason' => null,
                'scan_time' => '2024-12-09 08:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_identifier' => 'EMP-0001 (Ahmed Benali)',
                'accepted' => true,
                'rejection_reason' => null,
                'scan_time' => '2024-12-09 17:30:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_identifier' => 'EMP-0002 (Sara Ouazzani)',
                'accepted' => true,
                'rejection_reason' => null,
                'scan_time' => '2024-12-09 17:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_identifier' => 'Stagiaire (Fatima Zahra)',
                'accepted' => true,
                'rejection_reason' => null,
                'scan_time' => '2024-12-09 08:05:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_identifier' => 'Stagiaire (Fatima Zahra)',
                'accepted' => true,
                'rejection_reason' => null,
                'scan_time' => '2024-12-09 15:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_identifier' => 'Inconnu',
                'accepted' => false,
                'rejection_reason' => 'Visage non reconnu - distance > 0.6',
                'scan_time' => '2024-12-09 10:30:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_identifier' => 'EMP-0001 (Ahmed Benali)',
                'accepted' => false,
                'rejection_reason' => 'Double Check-In interdit',
                'scan_time' => '2024-12-09 12:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_identifier' => 'EMP-0002 (Sara Ouazzani)',
                'accepted' => false,
                'rejection_reason' => 'Délai minimum non respecté',
                'scan_time' => '2024-12-09 17:10:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_identifier' => 'EMP-0003 (Youssef Merzouk)',
                'accepted' => false,
                'rejection_reason' => 'Hors horaire autorisé',
                'scan_time' => '2024-12-09 14:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}