<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Post;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::query()->get();

        if ($categories->isEmpty()) {
            return;
        }

        $faker = fake();
        $totalPosts = rand(20, 35);

        for ($i = 0; $i < $totalPosts; $i++) {
            Post::create([
                'title' => ucfirst($faker->words(rand(4, 7), true)),
                'text' => $faker->paragraphs(rand(3, 6), true),
                'category_id' => $categories->random()->id,
            ]);
        }
    }
}
