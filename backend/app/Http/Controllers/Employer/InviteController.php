<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentInvite;
use App\Services\InviteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class InviteController extends Controller
{
    /**
     * Creates a one-time invite link. The link is returned only in this response.
     */
    public function store(Request $request, Department $department, InviteService $invites): JsonResponse
    {
        Gate::authorize('manage', $department);

        [$invite, $code] = $invites->create($department, $request->user());

        return response()->json(['data' => [
            'id' => $invite->id,
            'department_id' => $department->id,
            'url' => $invites->url($code),
            'expires_at' => $invite->expires_at->toIso8601String(),
        ]], 201);
    }

    public function destroy(DepartmentInvite $invite, InviteService $invites): Response
    {
        Gate::authorize('revoke', $invite);

        $invites->revoke($invite);

        return response()->noContent();
    }
}
