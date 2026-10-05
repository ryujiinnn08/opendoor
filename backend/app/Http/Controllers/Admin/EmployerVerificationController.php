<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EmployerType;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DecisionRequest;
use App\Http\Resources\AdminCompanyResource;
use App\Models\Employer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EmployerVerificationController extends Controller
{
    /**
     * Companies by verification status; the waiting queue is oldest first.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $status = $request->validate([
            'verification' => ['nullable', Rule::in(['pending', 'verified', 'rejected'])],
        ])['verification'] ?? 'pending';

        $companies = Employer::with('owner.user')
            ->where('type', EmployerType::Company)
            ->where('verification_status', $status)
            ->when(
                $status === 'pending',
                fn ($query) => $query->orderBy('verification_submitted_at'),
                fn ($query) => $query->latest('updated_at'),
            )
            ->limit(200)
            ->get();

        return AdminCompanyResource::collection($companies);
    }

    public function update(DecisionRequest $request, Employer $employer): AdminCompanyResource
    {
        if (! $employer->isCompany() || $employer->verification_status !== VerificationStatus::Pending) {
            throw ValidationException::withMessages(['decision' => 'This company is not waiting for review.']);
        }

        $approve = $request->validated('decision') === 'approve';

        $employer->forceFill([
            'verification_status' => $approve ? VerificationStatus::Verified : VerificationStatus::Rejected,
            'verified_at' => $approve ? now() : null,
            'verification_rejection_reason' => $approve ? null : $request->validated('reason'),
        ])->save();

        return new AdminCompanyResource($employer->load('owner.user'));
    }
}
