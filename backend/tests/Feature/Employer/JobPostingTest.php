<?php

namespace Tests\Feature\Employer;

use App\Models\Accommodation;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\BuildsPostings;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class JobPostingTest extends TestCase
{
    use BuildsPostings, BuildsTeams, RefreshDatabase;

    public function test_a_draft_saves_with_just_a_title(): void
    {
        [, , $general] = $this->companyWithOwner();
        $hr = $this->hrOfficerIn($general);

        $this->actingAs($hr, 'web')->postJson('/api/employer/job-postings', ['title' => 'Data encoder'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.department.id', $general->id)
            ->assertJsonPath('data.actions', ['edit', 'delete']);
    }

    public function test_submitting_needs_every_field_and_an_accommodation(): void
    {
        [, , $general] = $this->companyWithOwner();

        $this->actingAs($this->hrOfficerIn($general), 'web')
            ->postJson('/api/employer/job-postings', ['title' => 'Data encoder', 'submit' => true])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['category_id', 'description', 'location', 'employment_type', 'work_setup', 'interview_format', 'closes_on'])
            ->assertJsonValidationErrors(['accommodations' => 'Choose at least one accommodation your workplace provides.']);
    }

    public function test_a_complete_posting_is_submitted_with_its_notes(): void
    {
        [, , $general] = $this->companyWithOwner();
        $payload = $this->completePosting();
        $payload['accommodations'][0]['note'] = '  Ramp at the side entrance  ';
        $payload['accommodations'][1]['note'] = '   ';

        $response = $this->actingAs($this->hrOfficerIn($general), 'web')->postJson('/api/employer/job-postings', $payload)
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->assertNotNull($response->json('data.submitted_at'));
        $notes = collect($response->json('data.accommodations'))->pluck('note')->all();
        $this->assertEqualsCanonicalizing(['Ramp at the side entrance', null], $notes);
    }

    public function test_owners_choose_a_department_and_hr_officers_cannot(): void
    {
        [$owner, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
        [, , $otherCompanysDepartment] = $this->companyWithOwner();

        $this->actingAs($owner, 'web')->postJson('/api/employer/job-postings', ['title' => 'Analyst'])
            ->assertJsonValidationErrors(['department_id' => 'Choose the department this job is in.']);
        $this->postJson('/api/employer/job-postings', ['title' => 'Analyst', 'department_id' => $otherCompanysDepartment->id])
            ->assertJsonValidationErrors(['department_id' => "Choose one of your company's departments."]);
        $this->postJson('/api/employer/job-postings', ['title' => 'Analyst', 'department_id' => $it->id])
            ->assertCreated()
            ->assertJsonPath('data.department.id', $it->id);

        $this->actingAs($this->hrOfficerIn($general), 'web')
            ->postJson('/api/employer/job-postings', ['title' => 'Clerk', 'department_id' => $it->id])
            ->assertCreated()
            ->assertJsonPath('data.department.id', $general->id);
    }

    public function test_individual_employers_postings_have_no_department(): void
    {
        [$individual] = $this->individualEmployer();

        $this->actingAs($individual, 'web')->postJson('/api/employer/job-postings', $this->completePosting(['department_id' => 99]))
            ->assertCreated()
            ->assertJsonPath('data.department', null)
            ->assertJsonPath('data.employer.type', 'individual');
    }

    public function test_retired_accommodations_cannot_be_added_but_may_stay(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $retired = Accommodation::factory()->retired()->create(['name' => 'Accessible parking']);
        $payload = $this->completePosting();
        $payload['accommodations'][] = ['id' => $retired->id, 'note' => null];

        $this->actingAs($individual, 'web')->postJson('/api/employer/job-postings', $payload)
            ->assertJsonValidationErrors(['accommodations.2.id' => '"Accessible parking" is no longer offered. Untick it to continue.']);

        $posting = JobPosting::factory()->in($employer)->create();
        $posting->accommodations()->attach($retired->id);
        $this->putJson("/api/employer/job-postings/{$posting->id}", array_merge($payload, ['submit' => false]))
            ->assertOk();
        $this->assertContains($retired->id, $posting->accommodations()->pluck('accommodations.id')->all());
    }

    public function test_the_same_accommodation_cannot_be_chosen_twice(): void
    {
        [$individual] = $this->individualEmployer();
        $payload = $this->completePosting();
        $payload['accommodations'][1]['id'] = $payload['accommodations'][0]['id'];

        $this->actingAs($individual, 'web')->postJson('/api/employer/job-postings', $payload)
            ->assertJsonValidationErrors(['accommodations.1.id' => 'Each accommodation can be chosen only once.']);
    }

    /**
     * @return array<string, array{0: string, 1: bool, 2: string}>
     */
    public static function savingCases(): array
    {
        return [
            'draft kept' => ['draft', false, 'draft'],
            'draft submitted' => ['draft', true, 'pending'],
            'rejected kept' => ['rejected', false, 'rejected'],
            'rejected resubmitted' => ['rejected', true, 'pending'],
            'waiting stays waiting' => ['pending', false, 'pending'],
            'open goes back to waiting' => ['open', false, 'pending'],
            'closed goes back to waiting' => ['closed', false, 'pending'],
            'expired goes back to waiting' => ['expired', false, 'pending'],
        ];
    }

    #[DataProvider('savingCases')]
    public function test_saving_follows_the_life_cycle(string $state, bool $submit, string $expected): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $factory = JobPosting::factory()->in($employer);
        $posting = ($state === 'draft' ? $factory : $factory->{$state}())->create();
        $before = $posting->submitted_at;

        $this->actingAs($individual, 'web')
            ->putJson("/api/employer/job-postings/{$posting->id}", $this->completePosting(['submit' => $submit]))
            ->assertOk()
            ->assertJsonPath('data.status', $expected);

        if ($state === 'pending') {
            $this->assertEquals($before, $posting->fresh()->submitted_at); // keeps its place in the queue
        }
        if ($state === 'rejected') {
            $this->assertSame($expected === 'pending' ? null : 'Describe the duties in more detail.', $posting->fresh()->rejection_reason);
        }
    }

    public function test_waiting_open_and_closed_postings_must_stay_complete(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $this->actingAs($individual, 'web');

        foreach (['pending', 'open', 'closed'] as $state) {
            $posting = JobPosting::factory()->in($employer)->{$state}()->create();

            $this->putJson("/api/employer/job-postings/{$posting->id}", $this->completePosting(['description' => '', 'submit' => false]))
                ->assertJsonValidationErrors(['description' => 'Describe the job.']);
        }
    }

    public function test_each_posting_lists_the_actions_allowed(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $expected = [
            'pending' => ['edit', 'delete'],
            'rejected' => ['edit', 'delete'],
            'open' => ['edit', 'close', 'change_closing_date', 'delete'],
            'closed' => ['edit', 'reopen', 'delete'],
            'expired' => ['edit', 'reopen', 'delete'],
        ];
        $this->actingAs($individual, 'web');

        foreach ($expected as $state => $actions) {
            $posting = JobPosting::factory()->in($employer)->{$state}()->create();

            $this->getJson("/api/employer/job-postings/{$posting->id}")->assertJsonPath('data.actions', $actions);
        }
    }

    public function test_job_seekers_and_admins_cannot_use_employer_posting_routes(): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->postJson('/api/employer/job-postings', ['title' => 'X'])
            ->assertForbidden();
        $this->actingAs(User::factory()->admin()->create(), 'web')
            ->postJson('/api/employer/job-postings', ['title' => 'X'])
            ->assertForbidden();
    }
}
