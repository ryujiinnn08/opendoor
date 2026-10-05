<?php

namespace Database\Factories;

use App\Enums\EmployerType;
use App\Enums\RegistrationType;
use App\Enums\VerificationStatus;
use App\Models\Employer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employer>
 */
class EmployerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'type' => EmployerType::Company,
            'name' => fake()->unique()->company(),
            'industry' => 'Information Technology',
            'address' => fake()->city(),
            'description' => fake()->sentence(),
        ];
    }

    public function individual(): static
    {
        return $this->state(fn () => ['type' => EmployerType::Individual, 'industry' => null]);
    }

    public function pendingVerification(): static
    {
        return $this->afterMaking(function (Employer $employer) {
            $employer->forceFill([
                'registration_type' => RegistrationType::Sec,
                'business_reg_no' => 'CS2026'.fake()->unique()->numberBetween(10000, 99999),
                'verification_status' => VerificationStatus::Pending,
                'verification_submitted_at' => now(),
            ]);
        });
    }

    public function verified(): static
    {
        return $this->pendingVerification()->afterMaking(function (Employer $employer) {
            $employer->forceFill(['verification_status' => VerificationStatus::Verified, 'verified_at' => now()]);
        });
    }
}
