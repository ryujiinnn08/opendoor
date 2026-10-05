<?php

namespace Tests\Feature\Employer;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_employers_without_a_profile_are_asked_to_set_one_up(): void
    {
        $user = User::factory()->employer()->create();

        $this->actingAs($user, 'web')->getJson('/api/me')->assertOk()->assertJsonPath('data.membership', null);

        $this->getJson('/api/employer/profile')
            ->assertStatus(409)
            ->assertJsonPath('code', 'employer_profile_required');
    }

    public function test_candidates_have_no_membership_field(): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonMissingPath('data.membership');
    }

    public function test_setting_up_a_company_makes_the_user_its_owner_with_a_first_department(): void
    {
        $user = User::factory()->employer()->create();

        $this->actingAs($user, 'web')->postJson('/api/employer/setup', [
            'type' => 'company',
            'name' => 'Acme Corp.',
            'industry' => 'Manufacturing',
            'address' => 'Pasig City',
        ])
            ->assertCreated()
            ->assertJsonPath('data.membership.role', 'owner')
            ->assertJsonPath('data.membership.employer.type', 'company')
            ->assertJsonPath('data.membership.employer.name', 'Acme Corp.')
            ->assertJsonPath('data.membership.employer.verification_status', 'not_submitted');

        $company = $user->fresh()->membership->employer;
        $this->assertSame(['General'], $company->departments->pluck('name')->all());
        $this->assertSame(3, $company->departments->first()->member_limit);
    }

    public function test_setting_up_an_individual_employer_has_no_departments(): void
    {
        $user = User::factory()->employer()->create(['name' => 'Rosa Reyes']);

        $this->actingAs($user, 'web')->postJson('/api/employer/setup', [
            'type' => 'individual',
            'name' => 'Rosa Reyes',
            'address' => 'Cebu City',
        ])
            ->assertCreated()
            ->assertJsonPath('data.membership.employer.type', 'individual')
            ->assertJsonPath('data.membership.department', null);

        $this->assertCount(0, $user->fresh()->membership->employer->departments);
    }

    public function test_companies_need_an_industry_and_everyone_needs_an_address(): void
    {
        $this->actingAs(User::factory()->employer()->create(), 'web')
            ->postJson('/api/employer/setup', ['type' => 'company', 'name' => 'Acme Corp.'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'industry' => 'Enter the company\'s industry.',
                'address' => 'Enter the company address.',
            ]);
    }

    public function test_an_employer_can_only_set_up_once(): void
    {
        $user = User::factory()->employer()->create();
        $data = ['type' => 'individual', 'name' => 'Rosa', 'address' => 'Cebu City'];

        $this->actingAs($user, 'web')->postJson('/api/employer/setup', $data)->assertCreated();
        $this->postJson('/api/employer/setup', $data)->assertStatus(409);
    }

    public function test_job_seekers_cannot_use_employer_setup(): void
    {
        $this->actingAs(User::factory()->create(), 'web')
            ->postJson('/api/employer/setup', ['type' => 'individual', 'name' => 'X', 'address' => 'Y'])
            ->assertForbidden();
    }
}
