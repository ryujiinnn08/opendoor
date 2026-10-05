<?php

namespace App\Http\Resources;

use App\Models\Department;
use App\Services\TeamCapacity;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A department as the company owner sees it on the Team page.
 *
 * @mixin Department
 */
class DepartmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $capacity = app(TeamCapacity::class);
        $openInvites = $this->invites()->open()->orderBy('created_at')->get();
        $hrOfficers = $this->hrOfficers()->with('user')->orderBy('created_at')->get();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'member_limit' => $this->member_limit,
            'effective_limit' => $capacity->effectiveLimit($this->resource),
            'places_used' => $hrOfficers->count() + $openInvites->count(),
            'has_free_place' => $capacity->hasFreePlace($this->resource),
            'hr_officers' => $hrOfficers->map(fn ($member) => [
                'id' => $member->id,
                'name' => $member->user->name,
                'email' => $member->user->email,
                'joined_at' => $member->created_at->toIso8601String(),
            ]),
            'open_invites' => $openInvites->map(fn ($invite) => [
                'id' => $invite->id,
                'created_at' => $invite->created_at->toIso8601String(),
                'expires_at' => $invite->expires_at->toIso8601String(),
            ]),
        ];
    }
}
