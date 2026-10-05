<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\DepartmentInvite;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<DepartmentInvite>
 */
class DepartmentInviteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'department_id' => Department::factory(),
            'token_hash' => DepartmentInvite::hashToken(Str::random(40)),
            'expires_at' => now()->addDays(7),
        ];
    }

    /**
     * Use a known code, so tests can open the invite link.
     */
    public function withCode(string $code): static
    {
        return $this->state(fn () => ['token_hash' => DepartmentInvite::hashToken($code)]);
    }

    public function expired(): static
    {
        return $this->state(fn () => ['expires_at' => now()->subMinute()]);
    }

    public function revoked(): static
    {
        return $this->afterMaking(fn (DepartmentInvite $invite) => $invite->forceFill(['revoked_at' => now()]));
    }

    public function used(): static
    {
        return $this->afterMaking(fn (DepartmentInvite $invite) => $invite->forceFill(['accepted_at' => now()]));
    }
}
