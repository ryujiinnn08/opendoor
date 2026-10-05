<?php

namespace App\Http\Resources;

use App\Enums\Role;
use App\Models\Employer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A company or individual employer profile. Registration details are shown only to the
 * owner and to administrators.
 *
 * @mixin Employer
 */
class EmployerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $canSeeRegistration = $viewer && ($viewer->role === Role::Admin || $viewer->ownsEmployer($this->id));

        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'name' => $this->name,
            'industry' => $this->industry,
            'address' => $this->address,
            'description' => $this->description,
            'logo_url' => $this->logoUrl(),
            'is_verified' => $this->isVerified(),
            'verification_status' => $this->verification_status->value,
            'verification' => $this->when($canSeeRegistration && $this->isCompany(), fn () => [
                'status' => $this->verification_status->value,
                'registration_type' => $this->registration_type?->value,
                'business_reg_no' => $this->business_reg_no,
                'submitted_at' => $this->verification_submitted_at?->toIso8601String(),
                'verified_at' => $this->verified_at?->toIso8601String(),
                'rejection_reason' => $this->verification_rejection_reason,
            ]),
        ];
    }
}
