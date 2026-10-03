<?php

namespace Database\Factories;

use App\Enums\AccommodationGroup;
use App\Models\Accommodation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Accommodation>
 */
class AccommodationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'group_name' => fake()->randomElement(AccommodationGroup::cases())->value,
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }

    public function retired(): static
    {
        return $this->state(fn (array $attributes) => ['is_active' => false]);
    }
}
