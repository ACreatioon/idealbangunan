<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AkunSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Ideal Bangunan',
            'email' => 'putrasionbangunan@ideal.com',
            'password' => 'sysadminputrasion',
            'role' => 'Administrator'
        ]);
    }
}
