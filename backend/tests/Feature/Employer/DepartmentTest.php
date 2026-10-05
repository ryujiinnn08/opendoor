<?php

namespace Tests\Feature\Employer;

use App\Models\AppSetting;
use App\Models\DepartmentInvite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class DepartmentTest extends TestCase
{
    use BuildsTeams, RefreshDatabase;

    public function test_owner_lists_departments_with_places_and_the_platform_cap(): void
    {
        [$owner, , $general] = $this->companyWithOwner();
        $this->hrOfficerIn($general);
        DepartmentInvite::factory()->for($general)->create();

        $this->actingAs($owner, 'web')->getJson('/api/employer/departments')
            ->assertOk()
            ->assertJsonPath('meta.cap', 10)
            ->assertJsonPath('data.0.name', 'General')
            ->assertJsonPath('data.0.places_used', 2)
            ->assertJsonPath('data.0.has_free_place', true)
            ->assertJsonCount(1, 'data.0.hr_officers')
            ->assertJsonCount(1, 'data.0.open_invites');
    }

    public function test_owner_adds_departments_with_the_default_or_a_chosen_limit(): void
    {
        [$owner] = $this->companyWithOwner();
        $this->actingAs($owner, 'web');

        $this->postJson('/api/employer/departments', ['name' => 'Finance'])
            ->assertCreated()
            ->assertJsonPath('data.member_limit', 3);

        $this->postJson('/api/employer/departments', ['name' => 'IT', 'member_limit' => 2])
            ->assertCreated()
            ->assertJsonPath('data.member_limit', 2);
    }

    public function test_limits_cannot_exceed_the_admin_cap(): void
    {
        [$owner] = $this->companyWithOwner();
        AppSetting::put(AppSetting::HR_PER_DEPARTMENT_CAP, 4);

        $this->actingAs($owner, 'web')
            ->postJson('/api/employer/departments', ['name' => 'IT', 'member_limit' => 5])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['member_limit' => 'OpenDoor allows at most 4 HR officers per department.']);
    }

    public function test_department_names_are_unique_within_a_company(): void
    {
        [$owner] = $this->companyWithOwner();

        $this->actingAs($owner, 'web')
            ->postJson('/api/employer/departments', ['name' => 'General'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name' => 'Your company already has a department with this name.']);

        // Another company may use the same name.
        [$otherOwner] = $this->companyWithOwner();
        $this->actingAs($otherOwner, 'web')
            ->postJson('/api/employer/departments', ['name' => 'Finance'])
            ->assertCreated();
        $this->actingAs($owner, 'web')
            ->postJson('/api/employer/departments', ['name' => 'Finance'])
            ->assertCreated();
    }

    public function test_limits_cannot_go_below_the_places_in_use(): void
    {
        [$owner, , $general] = $this->companyWithOwner();
        $this->hrOfficerIn($general);
        DepartmentInvite::factory()->for($general)->create();

        $this->actingAs($owner, 'web')
            ->putJson("/api/employer/departments/{$general->id}", ['name' => 'General', 'member_limit' => 1])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['member_limit' => 'General is using 2 places']);

        $this->putJson("/api/employer/departments/{$general->id}", ['name' => 'General', 'member_limit' => 2])
            ->assertOk()
            ->assertJsonPath('data.member_limit', 2);
    }

    public function test_renaming_keeps_a_limit_that_is_above_a_lowered_cap(): void
    {
        [$owner, , $general] = $this->companyWithOwner(limit: 5);
        AppSetting::put(AppSetting::HR_PER_DEPARTMENT_CAP, 2);

        $this->actingAs($owner, 'web')
            ->putJson("/api/employer/departments/{$general->id}", ['name' => 'Operations', 'member_limit' => 5])
            ->assertOk()
            ->assertJsonPath('data.name', 'Operations')
            ->assertJsonPath('data.member_limit', 5)
            ->assertJsonPath('data.effective_limit', 2);
    }

    public function test_only_empty_departments_can_be_deleted_and_never_the_last_one(): void
    {
        [$owner, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
        $this->hrOfficerIn($it);
        DepartmentInvite::factory()->for($general)->create();
        $this->actingAs($owner, 'web');

        $this->deleteJson("/api/employer/departments/{$it->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['department' => 'Move or remove the HR officers in IT before deleting it.']);

        $this->deleteJson("/api/employer/departments/{$general->id}")->assertNoContent();
        $this->assertDatabaseCount('department_invites', 0);

        $it->hrOfficers()->delete();
        $this->deleteJson("/api/employer/departments/{$it->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['department' => 'A company needs at least one department.']);
    }

    public function test_hr_officers_and_individuals_cannot_manage_departments(): void
    {
        [, , $general] = $this->companyWithOwner();
        $hr = $this->hrOfficerIn($general);

        $this->actingAs($hr, 'web')->getJson('/api/employer/departments')
            ->assertForbidden()
            ->assertJsonPath('message', 'Only the company owner can manage departments and invites.');
        $this->putJson("/api/employer/departments/{$general->id}", ['name' => 'Mine'])->assertForbidden();

        [$individual] = $this->individualEmployer();
        $this->actingAs($individual, 'web')->postJson('/api/employer/departments', ['name' => 'IT'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Individual employers don\'t have departments.');
    }

    public function test_owners_cannot_touch_another_companys_departments(): void
    {
        [, , $theirs] = $this->companyWithOwner();
        [$owner] = $this->companyWithOwner();

        $this->actingAs($owner, 'web');
        $this->putJson("/api/employer/departments/{$theirs->id}", ['name' => 'Taken over'])->assertForbidden();
        $this->deleteJson("/api/employer/departments/{$theirs->id}")->assertForbidden();
        $this->postJson("/api/employer/departments/{$theirs->id}/invites")->assertForbidden();
    }
}
