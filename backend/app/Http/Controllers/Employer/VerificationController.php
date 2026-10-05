<?php

namespace App\Http\Controllers\Employer;

use App\Enums\RegistrationType;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\VerificationRequest;
use App\Http\Resources\EmployerResource;
use Illuminate\Support\Facades\Gate;

class VerificationController extends Controller
{
    /**
     * Submits (or corrects) the registration number for an admin to check. Changing the number
     * of a verified company removes its badge until it is checked again.
     */
    public function store(VerificationRequest $request): EmployerResource
    {
        $employer = $request->user()->membership->employer;
        Gate::authorize('submitVerification', $employer);

        $type = $request->enum('registration_type', RegistrationType::class);
        $number = $request->validated('business_reg_no');

        $unchanged = $employer->registration_type === $type && $employer->business_reg_no === $number;
        if ($employer->isVerified() && $unchanged) {
            return new EmployerResource($employer);
        }

        $employer->forceFill([
            'registration_type' => $type,
            'business_reg_no' => $number,
            'verification_status' => VerificationStatus::Pending,
            'verification_submitted_at' => now(),
            'verified_at' => null,
            'verification_rejection_reason' => null,
        ])->save();

        return new EmployerResource($employer);
    }
}
