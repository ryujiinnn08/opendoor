<?php

namespace App\Http\Controllers\Employer;

use App\Enums\EmployerType;
use App\Enums\MemberRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SetupRequest;
use App\Http\Resources\UserResource;
use App\Models\Employer;
use App\Models\EmployerMember;
use App\Services\TeamCapacity;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * "Who are you hiring for?": creates a company (the user becomes its owner, with a first
 * department) or an individual employer profile.
 */
class SetupController extends Controller
{
    public function store(SetupRequest $request, TeamCapacity $capacity): JsonResponse
    {
        $user = $request->user();

        if ($user->membership()->exists()) {
            abort(409, 'You already have an employer profile.');
        }

        DB::transaction(function () use ($request, $user, $capacity) {
            $type = $request->enum('type', EmployerType::class);

            $employer = Employer::create([
                'type' => $type,
                'name' => $request->validated('name'),
                'industry' => $type === EmployerType::Company ? $request->validated('industry') : null,
                'address' => $request->validated('address'),
            ]);

            if ($type === EmployerType::Company) {
                $employer->departments()->create([
                    'name' => config('opendoor.teams.first_department_name'),
                    'member_limit' => $capacity->defaultLimit(),
                ]);
            }

            EmployerMember::create([
                'user_id' => $user->id,
                'employer_id' => $employer->id,
                'role' => MemberRole::Owner,
            ]);
        });

        return (new UserResource($user->fresh()))->response()->setStatusCode(201);
    }
}
