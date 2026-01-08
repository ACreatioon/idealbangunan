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
            'name' => 'Pak ....',
            'email' => 'putrasionbangunan@ideal.com',
            'password' => 'sysadminputrasion',
            'role' => 'Administrator'
        ]);

        User::create([
            'name' => 'Almas',
            'email' => 'almas@gmail.com',
            'password' => '123123123',
            'role' => 'Management'
        ]);
    }
}
