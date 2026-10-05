<?php

namespace Tests\Feature\Admin;

use App\Models\JobPosting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsPostings;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class PostingApprovalTest extends TestCase
{
    use BuildsPostings, BuildsTeams, RefreshDatabase;

    public function test_the_queue_lists_waiting_postings_oldest_first(): void
    {
        $newer = JobPosting::factory()->pending()->create(['submitted_at' => now()->subHour()]);
        $older = JobPosting::factory()->pending()->create(['submitted_at' => now()->subDay()]);
        JobPosting::factory()->create();
        JobPosting::factory()->open()->create();

        $this->actingAs(User::factory()->admin()->create(), 'web')->getJson('/api/admin/job-postings')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $older->id)
            ->assertJsonPath('data.1.id', $newer->id)
            ->assertJsonMissingPath('data.0.actions');
    }

    public function test_admin_approves_a_waiting_posting(): void
    {
        $posting = JobPosting::factory()->pending()->create();

        $this->actingAs(User::factory()->admin()->create(), 'web')
            ->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'approve'])
            ->assertOk()
            ->assertJsonPath('data.status', 'open');

        $this->assertNotNull($posting->fresh()->approved_at);
        $this->getJson('/api/admin/job-postings?status=open')->assertJsonPath('data.0.id', $posting->id);
    }

    public function test_rejecting_needs_a_reason_and_the_employer_sees_it(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $posting = JobPosting::factory()->in($employer)->pending()->create();

        $this->actingAs(User::factory()->admin()->create(), 'web')
            ->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'reject'])
            ->assertJsonValidationErrors(['reason' => 'Give a reason so they know what to fix.']);
        $this->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'reject', 'reason' => 'Say what the job involves.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');
        $this->getJson('/api/admin/job-postings?status=rejected')->assertJsonPath('data.0.id', $posting->id);

        $this->actingAs($individual, 'web')->getJson("/api/employer/job-postings/{$posting->id}")
            ->assertJsonPath('data.rejection_reason', 'Say what the job involves.');
    }

    public function test_only_waiting_postings_can_be_decided(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'web');

        foreach (['open', 'rejected', 'closed'] as $state) {
            $posting = JobPosting::factory()->{$state}()->create();

            $this->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'approve'])
                ->assertJsonValidationErrors(['decision' => 'This posting is not waiting for approval.']);
        }
    }

    public function test_admins_never_see_drafts(): void
    {
        $draft = JobPosting::factory()->create();
        $this->actingAs(User::factory()->admin()->create(), 'web');

        $this->getJson("/api/admin/job-postings/{$draft->id}")->assertNotFound();
        $this->getJson('/api/admin/job-postings?status=draft')->assertUnprocessable();
        $this->patchJson("/api/admin/job-postings/{$draft->id}/approve", ['decision' => 'approve'])
            ->assertJsonValidationErrors(['decision' => 'This posting is not waiting for approval.']);
    }

    public function test_an_edited_open_posting_shows_changed_after_approval(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $posting = JobPosting::factory()->in($employer)->open()->create();
        $this->actingAs($individual, 'web')
            ->putJson("/api/employer/job-postings/{$posting->id}", $this->completePosting(['submit' => false]))
            ->assertOk();

        $this->actingAs(User::factory()->admin()->create(), 'web')->getJson("/api/admin/job-postings/{$posting->id}")
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.changed_after_approval', true);
    }

    public function test_approving_a_posting_whose_date_passed_shows_it_as_closed(): void
    {
        $posting = JobPosting::factory()->pending()->create([
            'closes_on' => CarbonImmutable::parse(JobPosting::today())->subDay()->toDateString(),
        ]);

        $this->actingAs(User::factory()->admin()->create(), 'web')
            ->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'approve'])
            ->assertOk()
            ->assertJsonPath('data.status', 'closed')
            ->assertJsonPath('data.closed_automatically', true);
    }

    public function test_dashboard_counts_postings_waiting_for_approval(): void
    {
        JobPosting::factory()->count(2)->pending()->create();
        JobPosting::factory()->open()->create();

        $this->actingAs(User::factory()->admin()->create(), 'web')->getJson('/api/admin/dashboard')
            ->assertJsonPath('data.postings_waiting_for_approval', 2);
    }

    public function test_employers_cannot_use_admin_posting_routes(): void
    {
        [$individual, $employer] = $this->individualEmployer();
        $posting = JobPosting::factory()->in($employer)->pending()->create();

        $this->actingAs($individual, 'web')
            ->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'approve'])
            ->assertForbidden();
        $this->assertSame('pending', $posting->fresh()->status->value);
    }
}
