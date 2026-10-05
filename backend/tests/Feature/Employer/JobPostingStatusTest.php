<?php

namespace Tests\Feature\Employer;

use App\Models\JobPosting;
use App\Rules\ClosingDate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class JobPostingStatusTest extends TestCase
{
    use BuildsTeams, RefreshDatabase;

    public function test_an_open_posting_closes_and_reopens_without_approval(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $posting = JobPosting::factory()->in($employer)->open()->create();
        $approvedAt = $posting->approved_at;
        $submittedAt = $posting->submitted_at;
        $newDate = ClosingDate::earliest()->addDays(10)->toDateString();
        $this->actingAs($individual, 'web');

        $this->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'close'])
            ->assertOk()
            ->assertJsonPath('data.status', 'closed');
        $this->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'reopen', 'closes_on' => $newDate])
            ->assertOk()
            ->assertJsonPath('data.status', 'open')
            ->assertJsonPath('data.closes_on', $newDate);

        $this->assertEquals($approvedAt, $posting->fresh()->approved_at);
        $this->assertEquals($submittedAt, $posting->fresh()->submitted_at);
    }

    public function test_an_expired_posting_can_be_reopened(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $posting = JobPosting::factory()->in($employer)->expired()->create();

        $this->actingAs($individual, 'web')
            ->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'reopen', 'closes_on' => ClosingDate::earliest()->toDateString()])
            ->assertOk()
            ->assertJsonPath('data.status', 'open')
            ->assertJsonPath('data.closed_automatically', false);
    }

    public function test_changing_the_closing_date_keeps_the_posting_open(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $posting = JobPosting::factory()->in($employer)->open()->create();
        $newDate = ClosingDate::latest()->toDateString();

        $this->actingAs($individual, 'web')
            ->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'change_closing_date', 'closes_on' => $newDate])
            ->assertOk()
            ->assertJsonPath('data.status', 'open')
            ->assertJsonPath('data.closes_on', $newDate)
            ->assertJsonPath('data.changed_after_approval', false);
    }

    public function test_new_dates_must_be_tomorrow_to_six_months_ahead(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $closed = JobPosting::factory()->in($employer)->closed()->create();
        $open = JobPosting::factory()->in($employer)->open()->create();
        $this->actingAs($individual, 'web');

        $this->patchJson("/api/employer/job-postings/{$closed->id}/status", ['action' => 'reopen', 'closes_on' => JobPosting::today()])
            ->assertJsonValidationErrors(['closes_on' => ClosingDate::message()]);
        $this->patchJson("/api/employer/job-postings/{$open->id}/status", [
            'action' => 'change_closing_date',
            'closes_on' => ClosingDate::latest()->addDay()->toDateString(),
        ])->assertJsonValidationErrors(['closes_on' => ClosingDate::message()]);
        $this->patchJson("/api/employer/job-postings/{$closed->id}/status", ['action' => 'reopen'])
            ->assertJsonValidationErrors(['closes_on' => 'Choose a new closing date.']);
        $this->patchJson("/api/employer/job-postings/{$closed->id}/status", ['action' => 'archive'])
            ->assertJsonValidationErrors(['action' => 'Choose close, reopen or change_closing_date.']);
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: string}>
     */
    public static function refusedCases(): array
    {
        $close = 'Only open postings can be closed.';
        $reopen = 'Only closed postings can be reopened.';
        $change = 'Only open postings can have their closing date changed. Reopen a closed posting instead.';

        return [
            'close a draft' => ['draft', 'close', $close],
            'close a waiting posting' => ['pending', 'close', $close],
            'close a rejected posting' => ['rejected', 'close', $close],
            'close a closed posting' => ['closed', 'close', $close],
            'close an expired posting' => ['expired', 'close', $close],
            'reopen an open posting' => ['open', 'reopen', $reopen],
            'reopen a draft' => ['draft', 'reopen', $reopen],
            'reopen a waiting posting' => ['pending', 'reopen', $reopen],
            'reopen a rejected posting' => ['rejected', 'reopen', $reopen],
            're-date a closed posting' => ['closed', 'change_closing_date', $change],
            're-date an expired posting' => ['expired', 'change_closing_date', $change],
            're-date a draft' => ['draft', 'change_closing_date', $change],
            're-date a waiting posting' => ['pending', 'change_closing_date', $change],
        ];
    }

    #[DataProvider('refusedCases')]
    public function test_other_status_changes_are_refused(string $state, string $action, string $message): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $factory = JobPosting::factory()->in($employer);
        $posting = ($state === 'draft' ? $factory : $factory->{$state}())->create();
        $before = $posting->fresh()->only(['status', 'closes_on']);

        $this->actingAs($individual, 'web')
            ->patchJson("/api/employer/job-postings/{$posting->id}/status", [
                'action' => $action,
                'closes_on' => ClosingDate::earliest()->toDateString(),
            ])
            ->assertJsonValidationErrors(['action' => $message]);

        $this->assertEquals($before, $posting->fresh()->only(['status', 'closes_on']));
    }

    public function test_hr_officers_cannot_change_another_departments_posting(): void
    {
        [, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
        $posting = JobPosting::factory()->in($it)->open()->create();

        $this->actingAs($this->hrOfficerIn($general), 'web')
            ->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'close'])
            ->assertForbidden();
    }
}
