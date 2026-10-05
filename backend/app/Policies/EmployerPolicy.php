<?php

namespace App\Policies;

use App\Models\Employer;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EmployerPolicy
{
    /**
     * Owners and HR officers can view their own employer's profile.
     */
    public function view(User $user, Employer $employer): bool
    {
        return $user->membership?->employer_id === $employer->id;
    }

    public function update(User $user, Employer $employer): Response
    {
        return $user->ownsEmployer($employer->id)
            ? Response::allow()
            : Response::deny('Only the owner can change this profile.');
    }

    public function submitVerification(User $user, Employer $employer): Response
    {
        if (! $employer->isCompany()) {
            return Response::deny('Only companies can be verified.');
        }

        return $user->ownsEmployer($employer->id)
            ? Response::allow()
            : Response::deny('Only the company owner can submit the registration number.');
    }

    public function manageTeam(User $user, Employer $employer): Response
    {
        if (! $employer->isCompany()) {
            return Response::deny('Individual employers don\'t have departments.');
        }

        return $user->ownsEmployer($employer->id)
            ? Response::allow()
            : Response::deny('Only the company owner can manage departments and invites.');
    }
}
