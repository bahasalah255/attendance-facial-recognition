<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupervisorSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('supervisors')->insert([
            [
                'first_name' => 'Khalid',
                'last_name' => 'Tazi',
                'email' => 'khalid.tazi@facep.com',
                'phone' => '0612345678',
                'department' => 'Informatique',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'Fatima',
                'last_name' => 'Benali',
                'email' => 'fatima.benali@facep.com',
                'phone' => '0687654321',
                'department' => 'Ressources Humaines',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'Omar',
                'last_name' => 'El Fassi',
                'email' => 'omar.elfassi@facep.com',
                'phone' => '0678945612',
                'department' => 'Marketing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}