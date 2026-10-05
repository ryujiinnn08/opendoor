<?php

namespace Tests\Concerns;

use App\Enums\MemberRole;
use App\Models\Department;
use App\Models\Employer;
use App\Models\EmployerMember;
use App\Models\User;

trait BuildsTeams
{
    /**
     * A company with its owner and one department ("General", limit 3).
     *
     * @return array{0: User, 1: Employer, 2: Department}
     */
    protected function companyWithOwner(array $employer = [], int $limit = 3): array
    {
        $company = Employer::factory()->create($employer);
        $department = $company->departments()->create(['name' => 'General', 'member_limit' => $limit]);
        $owner = $this->memberOf($company, MemberRole::Owner);

        return [$owner, $company, $department];
    }

    protected function hrOfficerIn(Department $department): User
    {
        return $this->memberOf($department->employer, MemberRole::Hr, $department);
    }

    /**
     * @return array{0: User, 1: Employer}
     */
    protected function individualEmployer(): array
    {
        $employer = Employer::factory()->individual()->create();

        return [$this->memberOf($employer, MemberRole::Owner), $employer];
    }

    private function memberOf(Employer $employer, MemberRole $role, ?Department $department = null): User
    {
        $user = User::factory()->employer()->create();

        EmployerMember::create([
            'user_id' => $user->id,
            'employer_id' => $employer->id,
            'department_id' => $department?->id,
            'role' => $role,
        ]);

        return $user;
    }
}
