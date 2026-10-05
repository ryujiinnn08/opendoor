<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\ProfileRequest;
use App\Http\Resources\EmployerResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * The company or individual profile of the logged-in employer.
 */
class ProfileController extends Controller
{
    public function show(Request $request): EmployerResource
    {
        $employer = $request->user()->membership->employer;
        Gate::authorize('view', $employer);

        return new EmployerResource($employer);
    }

    public function update(ProfileRequest $request): EmployerResource
    {
        $employer = $request->user()->membership->employer;
        Gate::authorize('update', $employer);

        $employer->update($request->validated());

        return new EmployerResource($employer);
    }
}
