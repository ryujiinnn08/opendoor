<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\MoveMemberRequest;
use App\Models\Department;
use App\Models\EmployerMember;
use App\Services\TeamCapacity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class MemberController extends Controller
{
    /**
     * Moves an HR officer to another department that has a free place.
     */
    public function update(MoveMemberRequest $request, EmployerMember $member, TeamCapacity $capacity): JsonResponse
    {
        Gate::authorize('manage', $member);

        $target = Department::findOrFail($request->validated('department_id'));

        if ($target->id !== $member->department_id) {
            if (! $capacity->hasFreePlace($target)) {
                throw ValidationException::withMessages([
                    'department_id' => "{$target->name} has no free places.",
                ]);
            }

            $member->update(['department_id' => $target->id]);
        }

        return response()->json(['data' => ['id' => $member->id, 'department_id' => $member->department_id]]);
    }

    /**
     * Disconnects an HR officer from the company. Their account stays; postings they created
     * stay with the department (plan PHASE_2 decision 19).
     */
    public function destroy(EmployerMember $member): Response
    {
        Gate::authorize('manage', $member);

        $member->delete();

        return response()->noContent();
    }
}
