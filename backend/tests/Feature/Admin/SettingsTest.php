<?php

namespace Tests\Feature\Admin;

use App\Models\DepartmentInvite;
use App\Models\Employer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use BuildsTeams, RefreshDatabase;

    public function test_admin_reads_and_changes_the_cap(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'web');

        $this->getJson('/api/admin/settings')->assertOk()->assertJsonPath('data.hr_per_department_cap', 10);
        $this->putJson('/api/admin/settings', ['hr_per_department_cap' => 5])->assertOk()->assertJsonPath('data.hr_per_department_cap', 5);
        $this->putJson('/api/admin/settings', ['hr_per_department_cap' => 0])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['hr_per_department_cap' => 'The maximum must be at least 1.']);
    }

    public function test_lowering_the_cap_keeps_members_but_blocks_new_invites(): void
    {
        [$owner, , $general] = $this->companyWithOwner(limit: 5);
        $this->hrOfficerIn($general);
        $this->hrOfficerIn($general);

        $this->actingAs(User::factory()->admin()->create(), 'web')
            ->putJson('/api/admin/settings', ['hr_per_department_cap' => 2])
            ->assertOk();

        $this->assertSame(2, $general->hrOfficers()->count());
        $this->actingAs($owner, 'web')
            ->postJson("/api/employer/departments/{$general->id}/invites")
            ->assertUnprocessable();
        $this->assertDatabaseCount('department_invites', 0);
        $this->assertSame(0, DepartmentInvite::count());
    }

    public function test_admin_dashboard_counts_waiting_companies(): void
    {
        $this->companyWithOwner();
        Employer::factory()->pendingVerification()->count(2)->create();

        $this->actingAs(User::factory()->admin()->create(), 'web')
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.companies_waiting_for_verification', 2)
            ->assertJsonPath('data.hr_per_department_cap', 10);
    }
}
