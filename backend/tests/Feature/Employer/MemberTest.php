<?php

namespace Tests\Feature\Employer;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class MemberTest extends TestCase
{
    use BuildsTeams, RefreshDatabase;

    public function test_owner_moves_an_hr_officer_into_a_department_with_room(): void
    {
        [$owner, $company, $general] = $this->companyWithOwner();
        $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 1]);
        $hr = $this->hrOfficerIn($general);

        $this->actingAs($owner, 'web')
            ->patchJson("/api/employer/members/{$hr->membership->id}", ['department_id' => $it->id])
            ->assertOk();
        $this->assertSame($it->id, $hr->fresh()->membership->department_id);

        // IT is now full.
        $another = $this->hrOfficerIn($general);
        $this->patchJson("/api/employer/members/{$another->membership->id}", ['department_id' => $it->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['department_id' => 'IT has no free places.']);
    }

    public function test_hr_officers_cannot_be_moved_into_another_companys_department(): void
    {
        [$owner, , $general] = $this->companyWithOwner();
        [, , $theirs] = $this->companyWithOwner();
        $hr = $this->hrOfficerIn($general);

        $this->actingAs($owner, 'web')
            ->patchJson("/api/employer/members/{$hr->membership->id}", ['department_id' => $theirs->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['department_id']);
    }

    public function test_a_removed_hr_officer_keeps_their_account_but_loses_access(): void
    {
        [$owner, , $general] = $this->companyWithOwner();
        $hr = $this->hrOfficerIn($general);

        $this->actingAs($owner, 'web')
            ->deleteJson("/api/employer/members/{$hr->membership->id}")
            ->assertNoContent();

        $this->assertModelExists($hr);
        $this->actingAs($hr->fresh(), 'web')
            ->getJson('/api/employer/profile')
            ->assertStatus(409)
            ->assertJsonPath('code', 'employer_profile_required');
    }

    public function test_the_owner_cannot_be_moved_or_removed(): void
    {
        [$owner, , $general] = $this->companyWithOwner();

        $this->actingAs($owner, 'web')
            ->deleteJson("/api/employer/members/{$owner->membership->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'The owner can\'t be moved or removed.');
        $this->patchJson("/api/employer/members/{$owner->membership->id}", ['department_id' => $general->id])
            ->assertForbidden();
    }

    public function test_other_owners_and_hr_officers_cannot_manage_members(): void
    {
        [, , $general] = $this->companyWithOwner();
        $hr = $this->hrOfficerIn($general);
        $colleague = $this->hrOfficerIn($general);
        [$otherOwner] = $this->companyWithOwner();

        $this->actingAs($otherOwner, 'web')->deleteJson("/api/employer/members/{$hr->membership->id}")->assertForbidden();
        $this->actingAs($colleague, 'web')->deleteJson("/api/employer/members/{$hr->membership->id}")->assertForbidden();
    }
}
