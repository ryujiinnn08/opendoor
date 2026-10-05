<?php

namespace App\Policies;

use App\Models\DepartmentInvite;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DepartmentInvitePolicy
{
    public function revoke(User $user, DepartmentInvite $invite): Response
    {
        return $user->ownsEmployer($invite->department->employer_id)
            ? Response::allow()
            : Response::deny('Only the company owner can revoke this invite.');
    }
}
