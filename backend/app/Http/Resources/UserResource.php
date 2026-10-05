<?php

namespace App\Http\Resources;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            // Employers only: null until they set up a company or individual profile.
            'membership' => $this->when($this->role === Role::Employer, function () {
                $membership = $this->membership()->with(['employer', 'department'])->first();

                return $membership ? new MembershipResource($membership) : null;
            }),
        ];
    }
}
