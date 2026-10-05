<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\PostingStatusRequest;
use App\Http\Resources\JobPostingResource;
use App\Models\JobPosting;
use App\Services\JobPostingWorkflow;

class JobPostingStatusController extends Controller
{
    /**
     * Close, reopen or change the closing date. None of these need a new approval.
     */
    public function update(PostingStatusRequest $request, JobPosting $posting, JobPostingWorkflow $workflow): JobPostingResource
    {
        $closesOn = $request->validated('closes_on');

        $posting = match ($request->validated('action')) {
            'close' => $workflow->close($posting),
            'reopen' => $workflow->reopen($posting, $closesOn),
            'change_closing_date' => $workflow->changeClosingDate($posting, $closesOn),
        };

        return new JobPostingResource($posting->load(JobPostingResource::RELATIONS));
    }
}
