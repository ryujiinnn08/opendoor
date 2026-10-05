<?php

namespace App\Policies;

use App\Models\Department;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DepartmentPolicy
{
    public function manage(User $user, Department $department): Response
    {
        return $user->ownsEmployer($department->employer_id)
            ? Response::allow()
            : Response::deny('Only the company owner can manage this department.');
    }
}
