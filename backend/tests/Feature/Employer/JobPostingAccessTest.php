<?php

namespace Tests\Feature\Employer;

use App\Models\JobPosting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsPostings;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class JobPostingAccessTest extends TestCase
{
    use BuildsPostings, BuildsTeams, RefreshDatabase;

    public function test_hr_officers_cannot_reach_another_departments_postings(): void
    {
        [$owner, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
        $posting = JobPosting::factory()->in($it)->pending()->create();
        $this->actingAs($this->hrOfficerIn($general), 'web');

        $message = 'You can only manage job postings in your own department.';
        $this->getJson("/api/employer/job-postings/{$posting->id}")->assertForbidden()->assertJsonPath('message', $message);
        $this->putJson("/api/employer/job-postings/{$posting->id}", $this->completePosting())->assertForbidden();
        $this->deleteJson("/api/employer/job-postings/{$posting->id}")->assertForbidden();

        $this->actingAs($owner, 'web')->getJson("/api/employer/job-postings/{$posting->id}")->assertOk();
    }

    public function test_other_companies_cannot_reach_a_posting(): void
    {
        [, , $department] = $this->companyWithOwner();
        $posting = JobPosting::factory()->in($department)->create();
        [$otherOwner] = $this->companyWithOwner();

        $this->actingAs($otherOwner, 'web')->getJson("/api/employer/job-postings/{$posting->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'This job posting belongs to another employer.');
        $this->deleteJson("/api/employer/job-postings/{$posting->id}")->assertForbidden();
        $this->assertNotSoftDeleted($posting);
    }

    public function test_lists_show_only_what_each_person_may_see(): void
    {
        [$owner, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
        $inGeneral = JobPosting::factory()->in($general)->create();
        JobPosting::factory()->in($it)->create();
        JobPosting::factory()->create(); // another company

        $this->actingAs($owner, 'web')->getJson('/api/employer/job-postings')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs($this->hrOfficerIn($general), 'web')->getJson('/api/employer/job-postings')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $inGeneral->id);
    }

    public function test_status_filters_use_the_shown_status(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $open = JobPosting::factory()->in($employer)->open()->create();
        $expired = JobPosting::factory()->in($employer)->expired()->create();
        $closed = JobPosting::factory()->in($employer)->closed()->create();
        $this->actingAs($individual, 'web');

        $this->assertSame([$open->id], $this->getJson('/api/employer/job-postings?status=open')->json('data.*.id'));
        $this->assertEqualsCanonicalizing(
            [$expired->id, $closed->id],
            $this->getJson('/api/employer/job-postings?status=closed')->json('data.*.id'),
        );
        $this->assertCount(3, $this->getJson('/api/employer/job-postings?status=all')->json('data'));
        $this->getJson('/api/employer/job-postings?status=archived')->assertUnprocessable();
    }

    public function test_owners_filter_by_department_and_hr_officers_cannot(): void
    {
        [$owner, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
        JobPosting::factory()->in($general)->create();
        $inIt = JobPosting::factory()->in($it)->create();

        $this->actingAs($owner, 'web')->getJson("/api/employer/job-postings?department={$it->id}")
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $inIt->id);
        $this->actingAs($this->hrOfficerIn($general), 'web')->getJson("/api/employer/job-postings?department={$it->id}")
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.department.id', $general->id);
    }

    public function test_deleted_postings_disappear_but_are_kept(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $posting = JobPosting::factory()->in($employer)->open()->create();
        $this->actingAs($individual, 'web');

        $this->deleteJson("/api/employer/job-postings/{$posting->id}")->assertNoContent();
        $this->getJson('/api/employer/job-postings')->assertJsonCount(0, 'data');
        $this->getJson("/api/employer/job-postings/{$posting->id}")->assertNotFound();
        $this->assertSoftDeleted($posting);
    }

    public function test_moved_or_removed_hr_officers_lose_their_old_departments_postings(): void
    {
        [, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
        $hr = $this->hrOfficerIn($general);
        $posting = JobPosting::factory()->in($general)->create();

        $hr->membership->update(['department_id' => $it->id]);
        $this->actingAs($hr->fresh(), 'web')->putJson("/api/employer/job-postings/{$posting->id}", ['title' => 'Renamed'])
            ->assertForbidden()
            ->assertJsonPath('message', 'You can only manage job postings in your own department.');

        $hr->membership->delete();
        $this->actingAs($hr->fresh(), 'web')->putJson("/api/employer/job-postings/{$posting->id}", ['title' => 'Renamed'])
            ->assertStatus(409)
            ->assertJsonPath('code', 'employer_profile_required');
        $this->assertNotSame('Renamed', $posting->fresh()->title);
    }

    public function test_dashboard_counts_match_what_each_person_may_see(): void
    {
        [$owner, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
        JobPosting::factory()->in($general)->open()->create();
        JobPosting::factory()->in($general)->expired()->create();
        JobPosting::factory()->in($it)->pending()->create();
        JobPosting::factory()->in($it)->create();

        $this->actingAs($owner, 'web')->getJson('/api/employer/dashboard')
            ->assertExactJson(['data' => ['postings' => ['draft' => 1, 'pending' => 1, 'open' => 1, 'rejected' => 0, 'closed' => 1]]]);
        $this->actingAs($this->hrOfficerIn($general), 'web')->getJson('/api/employer/dashboard')
            ->assertJsonPath('data.postings.open', 1)
            ->assertJsonPath('data.postings.pending', 0)
            ->assertJsonPath('data.postings.closed', 1);
    }
}
