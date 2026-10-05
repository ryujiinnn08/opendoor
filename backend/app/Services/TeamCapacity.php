<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\Department;

/**
 * Department HR limits (plan PHASE_2 decisions 3a, 15 and 16).
 *
 * A department's places used = HR officers + invites not yet used. The owner's limit is
 * never above the admin's platform cap; if the cap is lowered later, existing members stay
 * but the department can't invite more until it is under the new cap.
 */
class TeamCapacity
{
    public function cap(): int
    {
        return (int) AppSetting::get(AppSetting::HR_PER_DEPARTMENT_CAP, config('opendoor.teams.default_hr_cap'));
    }

    public function defaultLimit(): int
    {
        return min((int) config('opendoor.teams.default_department_limit'), $this->cap());
    }

    public function effectiveLimit(Department $department): int
    {
        return min($department->member_limit, $this->cap());
    }

    public function hrCount(Department $department): int
    {
        return $department->hrOfficers()->count();
    }

    public function openInviteCount(Department $department): int
    {
        return $department->invites()->open()->count();
    }

    public function placesUsed(Department $department): int
    {
        return $this->hrCount($department) + $this->openInviteCount($department);
    }

    /**
     * Room for a new invite, or for an HR officer moved in from another department.
     */
    public function hasFreePlace(Department $department): bool
    {
        return $this->placesUsed($department) < $this->effectiveLimit($department);
    }

    /**
     * Accepting an invite uses the place the invite already holds, but the department must
     * still be under its (possibly lowered) limit.
     */
    public function canAcceptInto(Department $department): bool
    {
        return $this->hrCount($department) < $this->effectiveLimit($department);
    }
}
