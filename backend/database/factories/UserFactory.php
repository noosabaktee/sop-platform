<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return ['company_id' => Company::factory(), 'name' => fake()->name(), 'email' => fake()->unique()->safeEmail(), 'password' => 'password', 'role' => 'user', 'is_active' => true, 'email_verified_at' => now()];
    }
}
