<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categoryNames = [
            'Technology',
            'Business',
            'Health',
            'Science',
            'Education',
            'Travel',
            'Food',
            'Lifestyle',
            'Sports',
            'Entertainment',
        ];

        shuffle($categoryNames);

        foreach (array_slice($categoryNames, 0, rand(5, 8)) as $name) {
            Category::firstOrCreate(['name' => $name]);
        }
    }
}
