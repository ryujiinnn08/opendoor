<?php

namespace Tests\Feature\Employer;

use App\Models\Employer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class VerificationTest extends TestCase
{
    use BuildsTeams, RefreshDatabase;

    public function test_owner_submits_the_registration_number_for_review(): void
    {
        [$owner, $company] = $this->companyWithOwner();

        $this->actingAs($owner, 'web')
            ->postJson('/api/employer/verification', ['registration_type' => 'sec', 'business_reg_no' => ' cs2026-12345 '])
            ->assertOk()
            ->assertJsonPath('data.verification_status', 'pending')
            ->assertJsonPath('data.verification.business_reg_no', 'CS2026-12345')
            ->assertJsonPath('data.verification.registration_type', 'sec');

        $this->assertNotNull($company->fresh()->verification_submitted_at);
    }

    public function test_registration_numbers_must_be_5_to_20_letters_numbers_or_dashes(): void
    {
        [$owner] = $this->companyWithOwner();

        $this->actingAs($owner, 'web')
            ->postJson('/api/employer/verification', ['registration_type' => 'dti', 'business_reg_no' => '12#4'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['business_reg_no' => 'Enter 5 to 20 letters, numbers or dashes']);
    }

    public function test_individual_employers_and_hr_officers_cannot_submit(): void
    {
        [$individual] = $this->individualEmployer();
        $this->actingAs($individual, 'web')
            ->postJson('/api/employer/verification', ['registration_type' => 'dti', 'business_reg_no' => '1234567'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Only companies can be verified.');

        [, , $department] = $this->companyWithOwner();
        $this->actingAs($this->hrOfficerIn($department), 'web')
            ->postJson('/api/employer/verification', ['registration_type' => 'dti', 'business_reg_no' => '1234567'])
            ->assertForbidden();
    }

    public function test_admin_sees_the_queue_and_verifies_a_company(): void
    {
        $this->companyWithOwner(['name' => 'Not submitted yet Co.']);
        $company = Employer::factory()->pendingVerification()->create(['name' => 'Waiting Co.']);

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'web')->getJson('/api/admin/employers')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Waiting Co.')
            ->assertJsonPath('data.0.verification.registration_type', 'sec');

        $this->patchJson("/api/admin/employers/{$company->id}/verify", ['decision' => 'approve'])
            ->assertOk()
            ->assertJsonPath('data.is_verified', true);

        $this->assertNotNull($company->fresh()->verified_at);
        $this->getJson('/api/admin/employers?verification=verified')->assertJsonPath('data.0.id', $company->id);
    }

    public function test_rejecting_needs_a_reason_and_the_owner_sees_it(): void
    {
        [$owner, $company] = $this->companyWithOwner();
        $this->actingAs($owner, 'web')
            ->postJson('/api/employer/verification', ['registration_type' => 'dti', 'business_reg_no' => '3456789'])
            ->assertOk();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'web')
            ->patchJson("/api/admin/employers/{$company->id}/verify", ['decision' => 'reject'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reason' => 'Give a reason']);

        $this->patchJson("/api/admin/employers/{$company->id}/verify", ['decision' => 'reject', 'reason' => 'The number does not match the company name.'])
            ->assertOk();

        $this->actingAs($owner->fresh(), 'web')->getJson('/api/employer/profile')
            ->assertJsonPath('data.verification_status', 'rejected')
            ->assertJsonPath('data.verification.rejection_reason', 'The number does not match the company name.');
    }

    public function test_only_waiting_companies_can_be_decided_and_individuals_never(): void
    {
        $admin = User::factory()->admin()->create();
        [, $company] = $this->companyWithOwner();
        [, $individual] = $this->individualEmployer();

        foreach ([$company, $individual] as $employer) {
            $this->actingAs($admin, 'web')
                ->patchJson("/api/admin/employers/{$employer->id}/verify", ['decision' => 'approve'])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['decision' => 'This company is not waiting for review.']);
        }
    }

    public function test_changing_the_number_after_verification_removes_the_badge(): void
    {
        [$owner, $company] = $this->companyWithOwner();
        $company->forceFill([
            'registration_type' => 'sec', 'business_reg_no' => 'CS2026-00001',
            'verification_status' => 'verified', 'verified_at' => now(),
        ])->save();

        $this->actingAs($owner, 'web')
            ->postJson('/api/employer/verification', ['registration_type' => 'sec', 'business_reg_no' => 'CS2026-00001'])
            ->assertOk()
            ->assertJsonPath('data.is_verified', true);

        $this->postJson('/api/employer/verification', ['registration_type' => 'sec', 'business_reg_no' => 'CS2026-99999'])
            ->assertOk()
            ->assertJsonPath('data.is_verified', false)
            ->assertJsonPath('data.verification_status', 'pending');

        $this->assertNull($company->fresh()->verified_at);
    }
}
