<?php

namespace App\Http\Resources;

use App\Models\Employer;
use Illuminate\Http\Request;

/**
 * A company in the admin verification queue, with its owner's contact details.
 *
 * @mixin Employer
 */
class AdminCompanyResource extends EmployerResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'owner' => $this->owner?->user ? [
                'name' => $this->owner->user->name,
                'email' => $this->owner->user->email,
            ] : null,
            'departments_count' => $this->departments()->count(),
            'hr_officers_count' => $this->members()->where('role', 'hr')->count(),
        ];
    }
}
