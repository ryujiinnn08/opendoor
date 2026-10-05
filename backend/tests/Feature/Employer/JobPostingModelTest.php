<?php

namespace Tests\Feature\Employer;

use App\Enums\PostingStatus;
use App\Models\JobPosting;
use App\Rules\ClosingDate;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class JobPostingModelTest extends TestCase
{
    use BuildsTeams, RefreshDatabase;

    public function test_an_open_posting_closes_at_the_end_of_its_closing_day_in_manila(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-05 15:59:00')); // 23:59 in Manila
        $posting = JobPosting::factory()->open()->create(['closes_on' => '2026-10-05']);
        $this->assertSame(PostingStatus::Open, $posting->displayStatus());

        $this->travelTo(CarbonImmutable::parse('2026-10-05 16:30:00')); // 00:30 on October 6 in Manila
        $this->assertTrue($posting->fresh()->isExpired());
        $this->assertSame(PostingStatus::Closed, $posting->fresh()->displayStatus());
    }

    public function test_filters_count_expired_postings_as_closed(): void
    {
        $open = JobPosting::factory()->open()->create();
        $expired = JobPosting::factory()->expired()->create();
        $closed = JobPosting::factory()->closed()->create();

        $this->assertEqualsCanonicalizing([$open->id], JobPosting::inDisplayStatus(PostingStatus::Open)->pluck('id')->all());
        $this->assertEqualsCanonicalizing([$expired->id, $closed->id], JobPosting::inDisplayStatus(PostingStatus::Closed)->pluck('id')->all());
    }

    public function test_the_closing_date_range_uses_manila_dates(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-05 16:30:00')); // October 6 in Manila

        $this->assertSame('2026-10-07', ClosingDate::earliest()->toDateString());
        $this->assertSame('2027-04-06', ClosingDate::latest()->toDateString());
        $this->assertSame('Choose a closing date between October 7, 2026 and April 6, 2027.', ClosingDate::message());
    }

    public function test_six_months_after_august_31_is_february_28(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-08-31 02:00:00'));

        $this->assertSame('2027-02-28', ClosingDate::latest()->toDateString());
    }

    public function test_the_rule_refuses_dates_outside_the_range_and_bad_dates(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-05 02:00:00'));
        $passes = fn ($value) => Validator::make(['closes_on' => $value], ['closes_on' => [new ClosingDate]])->passes();

        $this->assertFalse($passes('2026-10-05'));
        $this->assertTrue($passes('2026-10-06'));
        $this->assertTrue($passes('2027-04-05'));
        $this->assertFalse($passes('2027-04-06'));
        $this->assertFalse($passes('06/10/2026'));
        $this->assertFalse($passes('2026-02-30'));
    }

    public function test_hr_officers_see_only_their_departments_postings(): void
    {
        [$owner, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
        $hr = $this->hrOfficerIn($general);
        $mine = JobPosting::factory()->in($general)->create();
        $theirs = JobPosting::factory()->in($it)->create();
        JobPosting::factory()->create(); // another company

        $this->assertEqualsCanonicalizing([$mine->id, $theirs->id], JobPosting::visibleTo($owner)->pluck('id')->all());
        $this->assertSame([$mine->id], JobPosting::visibleTo($hr)->pluck('id')->all());
    }
}
