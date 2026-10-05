<?php

namespace App\Policies;

use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class JobPostingPolicy
{
    /**
     * Viewing, saving, changing the status of and deleting a posting. Owners manage every
     * posting of their employer; HR officers only their own department's (decision 3c).
     */
    public function manage(User $user, JobPosting $posting): Response
    {
        $member = $user->membership;

        if ($member === null || $member->employer_id !== $posting->employer_id) {
            return Response::deny('This job posting belongs to another employer.');
        }

        return $member->isOwner() || $member->department_id === $posting->department_id
            ? Response::allow()
            : Response::deny('You can only manage job postings in your own department.');
    }
}
