<?php

namespace App\Http\Controllers\Employer;

use App\Enums\PostingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\JobPostingRequest;
use App\Http\Resources\JobPostingResource;
use App\Models\JobPosting;
use App\Services\JobPostingWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class JobPostingController extends Controller
{
    /**
     * The postings this person may see, newest change first. `status` filters by the status
     * people see; company owners can also filter by `department`.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(['all', ...array_column(PostingStatus::cases(), 'value')])],
            'department' => ['nullable', 'integer'],
        ]);
        $status = $filters['status'] ?? 'all';
        $member = $request->user()->membership;
        $ownsCompany = $member->isOwner() && $member->employer->isCompany();

        $postings = JobPosting::visibleTo($request->user())
            ->with(JobPostingResource::RELATIONS)
            ->when($status !== 'all', fn ($query) => $query->inDisplayStatus(PostingStatus::from($status)))
            ->when($ownsCompany && isset($filters['department']), fn ($query) => $query->where('department_id', $filters['department']))
            ->latest('updated_at')
            ->latest('id')
            ->limit(200)
            ->get();

        return JobPostingResource::collection($postings);
    }

    /**
     * Saves a draft, or submits it straight away with `submit: true`.
     */
    public function store(JobPostingRequest $request, JobPostingWorkflow $workflow): JsonResponse
    {
        $posting = $workflow->create(
            $request->user(),
            $request->postingFields(),
            $request->accommodationList(),
            $request->boolean('submit'),
        );

        return (new JobPostingResource($posting->load(JobPostingResource::RELATIONS)))->response()->setStatusCode(201);
    }

    public function show(JobPosting $posting): JobPostingResource
    {
        Gate::authorize('manage', $posting);

        return new JobPostingResource($posting->load(JobPostingResource::RELATIONS));
    }

    /**
     * Saves changes; the request has already checked the department (JobPostingRequest::authorize).
     */
    public function update(JobPostingRequest $request, JobPosting $posting, JobPostingWorkflow $workflow): JobPostingResource
    {
        $posting = $workflow->update(
            $posting,
            $request->user(),
            $request->postingFields(),
            $request->accommodationList(),
            $request->boolean('submit'),
        );

        return new JobPostingResource($posting->load(JobPostingResource::RELATIONS));
    }

    /**
     * Hides the posting everywhere; it stays in the database (soft delete, §4.4).
     */
    public function destroy(JobPosting $posting): Response
    {
        Gate::authorize('manage', $posting);

        $posting->delete();

        return response()->noContent();
    }
}
