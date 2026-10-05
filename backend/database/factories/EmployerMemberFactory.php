<?php

namespace Database\Factories;

use App\Enums\MemberRole;
use App\Models\Employer;
use App\Models\EmployerMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployerMember>
 */
class EmployerMemberFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->employer(),
            'employer_id' => Employer::factory(),
            'department_id' => null,
            'role' => MemberRole::Owner,
        ];
    }
}
