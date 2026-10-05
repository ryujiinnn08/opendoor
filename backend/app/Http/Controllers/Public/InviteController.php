<?php

namespace App\Http\Controllers\Public;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AcceptInviteRequest;
use App\Http\Resources\UserResource;
use App\Models\DepartmentInvite;
use App\Models\User;
use App\Services\InviteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * The "Join a team" page: shows who sent the invite and lets the HR officer join.
 */
class InviteController extends Controller
{
    public function show(string $code, InviteService $invites): JsonResponse
    {
        $invite = $this->findOrFail($code, $invites);
        $reason = $invites->unavailableReason($invite);

        return response()->json(['data' => [
            'company' => $invite->department->employer->name,
            'department' => $invite->department->name,
            'expires_at' => $invite->expires_at->toIso8601String(),
            'available' => $reason === null,
            'reason' => $reason,
            'message' => $reason ? $invites->reasonMessage($reason, $invite) : null,
        ]]);
    }

    /**
     * Guests create an account through the invite. A logged-in employer who has no employer
     * profile yet (e.g., an HR officer removed from another company) joins with that account.
     */
    public function accept(AcceptInviteRequest $request, string $code, InviteService $invites): JsonResponse
    {
        $invite = $this->findOrFail($code, $invites);
        $current = $request->user();

        if ($current) {
            if ($current->role !== Role::Employer || $current->membership()->exists() || ! $current->is_active) {
                abort(409, "You're logged in as {$current->name}, who can't join this company. Log out to accept the invite with a new account.");
            }

            $invites->accept($invite, $current);

            return (new UserResource($current->fresh()))->response();
        }

        $user = DB::transaction(function () use ($request, $invite, $invites) {
            $user = User::create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'password' => $request->validated('password'),
                'role' => Role::Employer,
                'consented_at' => now(),
            ]);

            $invites->accept($invite, $user);

            return $user;
        });

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return (new UserResource($user->fresh()))->response()->setStatusCode(201);
    }

    private function findOrFail(string $code, InviteService $invites): DepartmentInvite
    {
        return $invites->find($code)
            ?? abort(404, 'This invite link is not valid. Check that you copied the whole link.');
    }
}
