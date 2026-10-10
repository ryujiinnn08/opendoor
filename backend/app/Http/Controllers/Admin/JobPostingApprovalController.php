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

    /**
     * Approve or reject (with a reason) the version the admin reviewed: the page sends back the
     * posting's `updated_at`, and a posting changed since then is refused with 409.
     */
    public function update(DecisionRequest $request, JobPosting $posting, JobPostingWorkflow $workflow): JobPostingResource
    {
        $reviewed = $request->validate(
            ['updated_at' => ['required', 'string']],
            ['updated_at.required' => 'Reload the page and review the posting again.'],
        )['updated_at'];

        $posting = $workflow->decide($posting, $request->validated('decision'), $request->validated('reason'), $reviewed);

        return new JobPostingResource($posting->load(JobPostingResource::RELATIONS));
    }
}
