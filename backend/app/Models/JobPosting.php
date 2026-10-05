<?php

namespace App\Models;

use App\Enums\EmploymentType;
use App\Enums\InterviewFormat;
use App\Enums\PostingStatus;
use App\Enums\WorkSetup;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobPosting extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The status, employer, department, author and approval dates are set by
     * JobPostingWorkflow, never from request input.
     */
    protected $fillable = [
        'title',
        'description',
        'location',
        'employment_type',
        'work_setup',
        'interview_format',
        'closes_on',
        'category_id',
    ];

    protected $attributes = [
        'status' => 'draft',
    ];

    protected function casts(): array
    {
        return [
            'status' => PostingStatus::class,
            'employment_type' => EmploymentType::class,
            'work_setup' => WorkSetup::class,
            'interview_format' => InterviewFormat::class,
            'closes_on' => 'date',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function accommodations(): BelongsToMany
    {
        return $this->belongsToMany(Accommodation::class, 'job_posting_accommodation')->withPivot('note');
    }

    /**
     * Today's date in Philippine time (Y-m-d); closing dates are whole days there.
     */
    public static function today(): string
    {
        return now(config('opendoor.postings.timezone'))->toDateString();
    }

    /**
     * An open posting whose closing date has passed. It is shown and filtered as Closed,
     * so no scheduled job is needed (plan D7).
     */
    public function isExpired(): bool
    {
        return $this->status === PostingStatus::Open
            && $this->closes_on !== null
            && $this->closes_on->toDateString() < static::today();
    }

    /**
     * The status people see.
     */
    public function displayStatus(): PostingStatus
    {
        return $this->isExpired() ? PostingStatus::Closed : $this->status;
    }

    /**
     * Postings shown with the given status: an open posting past its closing date counts as Closed.
     */
    public function scopeInDisplayStatus(Builder $query, PostingStatus $status): void
    {
        $today = static::today();

        match ($status) {
            PostingStatus::Open => $query
                ->where('status', PostingStatus::Open)
                ->where(fn (Builder $query) => $query->whereNull('closes_on')->orWhere('closes_on', '>=', $today)),
            PostingStatus::Closed => $query->where(fn (Builder $query) => $query
                ->where('status', PostingStatus::Closed)
                ->orWhere(fn (Builder $query) => $query->where('status', PostingStatus::Open)->where('closes_on', '<', $today))),
            default => $query->where('status', $status),
        };
    }

    /**
     * Postings this employer member may see: the whole employer for owners, only their own
     * department for HR officers (decision 3c). People without a membership see none.
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        $member = $user->membership;

        if ($member === null) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where('employer_id', $member->employer_id);

        if (! $member->isOwner()) {
            $query->where('department_id', $member->department_id);
        }
    }
}
