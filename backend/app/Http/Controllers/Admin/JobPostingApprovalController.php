<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PostingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DecisionRequest;
use App\Http\Resources\JobPostingResource;
use App\Models\JobPosting;
use App\Services\JobPostingWorkflow;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class JobPostingApprovalController extends Controller
{
    /**
     * Postings by status (decision 33): the waiting queue is oldest first; open and rejected
     * postings are newest change first. Drafts are never listed.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $status = PostingStatus::from($request->validate([
            'status' => ['nullable', Rule::in(['pending', 'open', 'rejected'])],
        ])['status'] ?? 'pending');

        $postings = JobPosting::with(JobPostingResource::RELATIONS)
            ->inDisplayStatus($status)
            ->when(
                $status === PostingStatus::Pending,
                fn ($query) => $query->orderBy('submitted_at')->orderBy('id'),
                fn ($query) => $query->latest('updated_at')->latest('id'),
            )
            ->limit(200)
            ->get();

        return JobPostingResource::collection($postings);
    }

    /**
     * Drafts belong to the employer until they are submitted, so admins can't open them.
     */
    public function show(JobPosting $posting): JobPostingResource
    {
        abort_if($posting->status === PostingStatus::Draft, 404);

        return new JobPostingResource($posting->load(JobPostingResource::RELATIONS));
    }

    public function update(DecisionRequest $request, JobPosting $posting, JobPostingWorkflow $workflow): JobPostingResource
    {
        if ($posting->status !== PostingStatus::Pending) {
            throw ValidationException::withMessages(['decision' => 'This posting is not waiting for approval.']);
        }

        $posting = $request->validated('decision') === 'approve'
            ? $workflow->approve($posting)
            : $workflow->reject($posting, $request->validated('reason'));

        return new JobPostingResource($posting->load(JobPostingResource::RELATIONS));
    }
}
