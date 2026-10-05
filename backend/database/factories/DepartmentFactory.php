<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Employer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Department>
 */
class DepartmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'employer_id' => Employer::factory(),
            'name' => fake()->unique()->randomElement(['Human Resources', 'IT', 'Finance', 'Operations', 'Marketing', 'Customer Support', 'Logistics', 'Design']),
            'member_limit' => 3,
        ];
    }
}
