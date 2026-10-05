<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\DepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Models\JobPosting;
use App\Services\TeamCapacity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class DepartmentController extends Controller
{
    public function index(Request $request, TeamCapacity $capacity): AnonymousResourceCollection
    {
        $employer = $request->user()->membership->employer;
        Gate::authorize('manageTeam', $employer);

        return DepartmentResource::collection($employer->departments()->get())
            ->additional(['meta' => ['cap' => $capacity->cap(), 'default_limit' => $capacity->defaultLimit()]]);
    }

    public function store(DepartmentRequest $request, TeamCapacity $capacity): JsonResponse
    {
        $employer = $request->user()->membership->employer;
        Gate::authorize('manageTeam', $employer);

        $department = $employer->departments()->create([
            'name' => $request->validated('name'),
            'member_limit' => $request->validated('member_limit') ?? $capacity->defaultLimit(),
        ]);

        return (new DepartmentResource($department))->response()->setStatusCode(201);
    }

    public function update(DepartmentRequest $request, Department $department): DepartmentResource
    {
        Gate::authorize('manage', $department);

        $department->update(array_filter(
            $request->validated(),
            fn ($value, $key) => $key !== 'member_limit' || $value !== null,
            ARRAY_FILTER_USE_BOTH,
        ));

        return new DepartmentResource($department);
    }

    /**
     * Only empty departments can be deleted: no HR officers and no postings, counting deleted
     * postings, which are kept (plan PHASE_2 decisions 20 and 32).
     */
    public function destroy(Department $department, TeamCapacity $capacity): Response
    {
        Gate::authorize('manage', $department);

        if ($capacity->hrCount($department) > 0) {
            throw ValidationException::withMessages([
                'department' => "Move or remove the HR officers in {$department->name} before deleting it.",
            ]);
        }

        if (JobPosting::withTrashed()->where('department_id', $department->id)->exists()) {
            throw ValidationException::withMessages([
                'department' => "{$department->name} has job postings (OpenDoor keeps deleted ones too), so it can't be deleted. Rename it instead.",
            ]);
        }

        if ($department->employer->departments()->count() === 1) {
            throw ValidationException::withMessages([
                'department' => 'A company needs at least one department. Rename this one instead.',
            ]);
        }

        // Unused invites for the department are deleted with it.
        $department->delete();

        return response()->noContent();
    }
}
