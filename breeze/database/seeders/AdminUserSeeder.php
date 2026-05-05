<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'playwright@example.com'],
            [
                'name' => 'Playwright',
                'password' => 'playwright',
                'is_admin' => true,
            ]
        );
    }
}
