<?php

namespace App\Services;

use App\Enums\MemberRole;
use App\Models\Department;
use App\Models\DepartmentInvite;
use App\Models\EmployerMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * One-time invite links that let HR officers join a company department (plan PHASE_2 §4.3).
 * Only a SHA-256 hash of the code is stored, so a database leak doesn't expose usable links.
 */
class InviteService
{
    public function __construct(private TeamCapacity $capacity) {}

    /**
     * @return array{0: DepartmentInvite, 1: string} The invite and the plain code (shown once).
     */
    public function create(Department $department, User $creator): array
    {
        if (! $this->capacity->hasFreePlace($department)) {
            throw ValidationException::withMessages([
                'department' => "{$department->name} has no free places. Raise its limit, revoke an unused invite, or move or remove someone first.",
            ]);
        }

        $code = Str::random(40);

        $invite = $department->invites()->create([
            'created_by' => $creator->id,
            'token_hash' => DepartmentInvite::hashToken($code),
            'expires_at' => now()->addDays((int) config('opendoor.teams.invite_lifetime_days')),
        ]);

        return [$invite, $code];
    }

    public function url(string $code): string
    {
        return rtrim(config('opendoor.frontend_url'), '/').'/join/'.$code;
    }

    public function find(string $code): ?DepartmentInvite
    {
        return DepartmentInvite::with('department.employer')
            ->where('token_hash', DepartmentInvite::hashToken($code))
            ->first();
    }

    /**
     * 'used', 'revoked', 'expired' or 'full' when the invite can't be accepted now; null when it can.
     */
    public function unavailableReason(DepartmentInvite $invite): ?string
    {
        return $invite->closedReason()
            ?? ($this->capacity->canAcceptInto($invite->department) ? null : 'full');
    }

    public function reasonMessage(string $reason, DepartmentInvite $invite): string
    {
        return match ($reason) {
            'used' => 'This invite link has already been used.',
            'revoked' => 'This invite link was cancelled by the company owner.',
            'expired' => 'This invite link has expired.',
            'full' => "{$invite->department->name} at {$invite->department->employer->name} has no free places right now.",
        };
    }

    /**
     * Adds the user to the invite's department as an HR officer and closes the invite.
     */
    public function accept(DepartmentInvite $invite, User $user): EmployerMember
    {
        return DB::transaction(function () use ($invite, $user) {
            // Lock both rows so two people can't use the last place at the same time.
            $invite = DepartmentInvite::whereKey($invite->id)->lockForUpdate()->firstOrFail();
            $department = Department::with('employer')->whereKey($invite->department_id)->lockForUpdate()->firstOrFail();
            $invite->setRelation('department', $department);

            if ($reason = $this->unavailableReason($invite)) {
                throw ValidationException::withMessages(['invite' => $this->reasonMessage($reason, $invite)]);
            }

            $member = EmployerMember::create([
                'user_id' => $user->id,
                'employer_id' => $department->employer_id,
                'department_id' => $department->id,
                'role' => MemberRole::Hr,
            ]);

            $invite->forceFill(['accepted_at' => now(), 'accepted_user_id' => $user->id])->save();

            return $member;
        });
    }

    public function revoke(DepartmentInvite $invite): void
    {
        if ($invite->accepted_at !== null) {
            throw ValidationException::withMessages(['invite' => 'This invite has already been used, so it can\'t be revoked.']);
        }

        if ($invite->revoked_at === null) {
            $invite->forceFill(['revoked_at' => now()])->save();
        }
    }
}
