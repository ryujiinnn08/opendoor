<?php

namespace App\Services;

use App\Enums\PostingStatus;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use LogicException;

/**
 * Saving job postings and changing their status (plan PHASE_2 §4.4, decisions 24–28 and 34).
 * The status, employer, department and author are only ever set here.
 */
class JobPostingWorkflow
{
    /**
     * @param  array<string, mixed>  $fields  Validated posting fields.
     * @param  list<array{id: int, note: ?string}>|null  $accommodations  Null when not sent.
     */
    public function create(User $author, array $fields, ?array $accommodations, bool $submit): JobPosting
    {
        return DB::transaction(function () use ($author, $fields, $accommodations, $submit) {
            $posting = new JobPosting;
            $posting->fill($fields)->forceFill([
                'employer_id' => $author->membership->employer_id,
                'department_id' => $this->departmentFor($author, $fields['department_id'] ?? null),
                'created_by' => $author->id,
                'status' => PostingStatus::Draft,
            ]);

            if ($submit) {
                $this->moveTo($posting, PostingStatus::Pending);
            }

            $posting->save();
            $this->syncAccommodations($posting, $accommodations ?? []);

            return $posting;
        });
    }

    /**
     * Saving a draft or rejected posting keeps its status unless it is submitted; a waiting
     * posting stays waiting; an open or closed one goes back for approval (decisions 6, 24, 26).
     *
     * @param  array<string, mixed>  $fields  Validated posting fields.
     * @param  list<array{id: int, note: ?string}>|null  $accommodations  Null when not sent.
     */
    public function update(JobPosting $posting, User $editor, array $fields, ?array $accommodations, bool $submit): JobPosting
    {
        return DB::transaction(function () use ($posting, $editor, $fields, $accommodations, $submit) {
            // Re-read under a lock: if an admin decided after this request loaded the posting,
            // the save must see the new status (an approved posting goes back for review).
            $posting = JobPosting::whereKey($posting->id)->lockForUpdate()->firstOrFail();

            $posting->fill($fields)->forceFill([
                'department_id' => $this->departmentFor($editor, $fields['department_id'] ?? $posting->department_id),
            ]);

            $next = match ($posting->status) {
                PostingStatus::Draft, PostingStatus::Rejected => $submit ? PostingStatus::Pending : $posting->status,
                PostingStatus::Pending, PostingStatus::Open, PostingStatus::Closed => PostingStatus::Pending,
            };

            if ($next !== $posting->status) {
                $this->moveTo($posting, $next);
            }

            $posting->save();

            if ($accommodations !== null) {
                $this->syncAccommodations($posting, $accommodations);
            }

            return $posting;
        });
    }

    public function close(JobPosting $posting): JobPosting
    {
        if ($posting->displayStatus() !== PostingStatus::Open) {
            throw ValidationException::withMessages(['action' => 'Only open postings can be closed.']);
        }

        $this->moveTo($posting, PostingStatus::Closed);
        $posting->save();

        return $posting;
    }

    /**
     * Reopening needs a new closing date but no approval (decision 7). A posting that closed
     * automatically is still stored as open, so only its date changes.
     */
    public function reopen(JobPosting $posting, string $closesOn): JobPosting
    {
        if ($posting->displayStatus() !== PostingStatus::Closed) {
            throw ValidationException::withMessages(['action' => 'Only closed postings can be reopened.']);
        }

        if ($posting->status !== PostingStatus::Open) {
            $this->moveTo($posting, PostingStatus::Open);
        }

        $posting->closes_on = $closesOn;
        $posting->save();

        return $posting;
    }

    /**
     * Changing only the date keeps an open posting open, with no new approval (decision 25).
     */
    public function changeClosingDate(JobPosting $posting, string $closesOn): JobPosting
    {
        if ($posting->displayStatus() !== PostingStatus::Open) {
            throw ValidationException::withMessages([
                'action' => 'Only open postings can have their closing date changed. Reopen a closed posting instead.',
            ]);
        }

        $posting->closes_on = $closesOn;
        $posting->save();

        return $posting;
    }

    /**
     * An admin approves or rejects the version of a waiting posting they reviewed. The row is
     * locked, and a posting changed since the admin loaded it is refused, so nothing goes live
     * unseen (decision 24 lets employers keep editing while it waits).
     */
    public function decide(JobPosting $posting, string $decision, ?string $reason, string $reviewedUpdatedAt): JobPosting
    {
        return DB::transaction(function () use ($posting, $decision, $reason, $reviewedUpdatedAt) {
            $posting = JobPosting::whereKey($posting->id)->lockForUpdate()->firstOrFail();

            if ($posting->status !== PostingStatus::Pending) {
                throw ValidationException::withMessages(['decision' => 'This posting is not waiting for approval.']);
            }

            if ($posting->updated_at?->toIso8601String() !== $reviewedUpdatedAt) {
                abort(409, 'This posting changed while you were reviewing it. Reload the page to see the latest version.');
            }

            if ($decision === 'approve') {
                $this->moveTo($posting, PostingStatus::Open);
                $posting->forceFill(['approved_at' => now(), 'rejection_reason' => null])->save();
            } else {
                $this->moveTo($posting, PostingStatus::Rejected);
                $posting->forceFill(['rejection_reason' => $reason])->save();
            }

            return $posting;
        });
    }

    /**
     * What the employer can do with the posting now (decision 34). Editing and deleting are
     * always possible; the rest depends on the status people see.
     *
     * @return list<string>
     */
    public function actionsFor(JobPosting $posting): array
    {
        return match ($posting->displayStatus()) {
            PostingStatus::Open => ['edit', 'close', 'change_closing_date', 'delete'],
            PostingStatus::Closed => ['edit', 'reopen', 'delete'],
            default => ['edit', 'delete'],
        };
    }

    /**
     * Individual employers have no departments; HR officers always post in their own; company
     * owners choose (decisions 22 and 28).
     */
    private function departmentFor(User $user, mixed $requested): ?int
    {
        $member = $user->membership;

        if (! $member->employer->isCompany()) {
            return null;
        }

        return $member->isOwner() ? (int) $requested : $member->department_id;
    }

    private function moveTo(JobPosting $posting, PostingStatus $next): void
    {
        if (! $posting->status->canTransitionTo($next)) {
            throw new LogicException("A {$posting->status->value} posting can't become {$next->value}.");
        }

        $posting->status = $next;

        if ($next === PostingStatus::Pending) {
            $posting->forceFill(['submitted_at' => now(), 'rejection_reason' => null]);
        }
    }

    /**
     * @param  list<array{id: int, note: ?string}>  $accommodations
     */
    private function syncAccommodations(JobPosting $posting, array $accommodations): void
    {
        $posting->accommodations()->sync(
            collect($accommodations)->mapWithKeys(fn (array $item) => [$item['id'] => ['note' => $item['note']]])->all(),
        );
    }
}
