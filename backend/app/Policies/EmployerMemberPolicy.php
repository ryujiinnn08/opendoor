<?php

namespace App\Policies;

use App\Models\EmployerMember;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EmployerMemberPolicy
{
    /**
     * Owners can move or remove their company's HR officers, but never the owner.
     */
    public function manage(User $user, EmployerMember $member): Response
    {
        if (! $user->ownsEmployer($member->employer_id)) {
            return Response::deny('Only the company owner can manage this team member.');
        }

        return $member->isOwner()
            ? Response::deny('The owner can\'t be moved or removed.')
            : Response::allow();
    }
}
