<?php

namespace App\Http\Resources;

use App\Models\EmployerMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Who the logged-in employer is hiring for, used by the React app for menus and guards.
 *
 * @mixin EmployerMember
 */
class MembershipResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'role' => $this->role->value,
            'department' => $this->department ? ['id' => $this->department->id, 'name' => $this->department->name] : null,
            'employer' => [
                'id' => $this->employer->id,
                'type' => $this->employer->type->value,
                'name' => $this->employer->name,
                'logo_url' => $this->employer->logoUrl(),
                'is_verified' => $this->employer->isVerified(),
                'verification_status' => $this->employer->verification_status->value,
            ],
        ];
    }
}
