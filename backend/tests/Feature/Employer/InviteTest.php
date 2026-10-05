<?php

namespace Tests\Feature\Employer;

use App\Enums\MemberRole;
use App\Models\AppSetting;
use App\Models\DepartmentInvite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class InviteTest extends TestCase
{
    use BuildsTeams, RefreshDatabase;

    private function newAccount(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Ana Cruz',
            'email' => 'ana@example.com',
            'password' => 'Secure@123',
            'password_confirmation' => 'Secure@123',
            'consent' => true,
        ], $overrides);
    }

    public function test_owner_creates_a_one_time_link_and_only_its_hash_is_stored(): void
    {
        [$owner, , $general] = $this->companyWithOwner();

        $response = $this->actingAs($owner, 'web')
            ->postJson("/api/employer/departments/{$general->id}/invites")
            ->assertCreated();

        $this->assertMatchesRegularExpression('#^http://localhost:5173/join/[A-Za-z0-9]{40}$#', $response->json('data.url'));
        $code = basename($response->json('data.url'));
        $invite = DepartmentInvite::first();
        $this->assertNotSame($code, $invite->token_hash);
        $this->assertSame(hash('sha256', $code), $invite->token_hash);
        $this->assertTrue($invite->expires_at->between(now()->addDays(7)->subMinute(), now()->addDays(7)->addMinute()));
    }

    public function test_invites_count_toward_the_limit_and_revoking_frees_a_place(): void
    {
        [$owner, , $general] = $this->companyWithOwner(limit: 2);
        $this->actingAs($owner, 'web');

        $first = $this->postJson("/api/employer/departments/{$general->id}/invites")->assertCreated()->json('data.id');
        $this->postJson("/api/employer/departments/{$general->id}/invites")->assertCreated();
        $this->postJson("/api/employer/departments/{$general->id}/invites")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['department' => 'General has no free places.']);

        $this->deleteJson("/api/employer/invites/{$first}")->assertNoContent();
        $this->postJson("/api/employer/departments/{$general->id}/invites")->assertCreated();
    }

    public function test_the_invite_page_shows_who_sent_it(): void
    {
        [, $company, $general] = $this->companyWithOwner(['name' => 'Acme Corp.']);
        DepartmentInvite::factory()->for($general)->withCode('valid-code')->create();

        $this->getJson('/api/invites/valid-code')
            ->assertOk()
            ->assertJsonPath('data.company', 'Acme Corp.')
            ->assertJsonPath('data.department', 'General')
            ->assertJsonPath('data.available', true);

        $this->getJson('/api/invites/unknown-code')
            ->assertNotFound()
            ->assertJsonPath('message', 'This invite link is not valid. Check that you copied the whole link.');
    }

    public function test_used_revoked_and_expired_invites_are_explained(): void
    {
        [, , $general] = $this->companyWithOwner();
        DepartmentInvite::factory()->for($general)->withCode('used-code')->used()->create();
        DepartmentInvite::factory()->for($general)->withCode('revoked-code')->revoked()->create();
        DepartmentInvite::factory()->for($general)->withCode('expired-code')->expired()->create();

        $this->getJson('/api/invites/used-code')->assertJsonPath('data.reason', 'used')->assertJsonPath('data.available', false);
        $this->getJson('/api/invites/revoked-code')->assertJsonPath('data.reason', 'revoked');
        $this->getJson('/api/invites/expired-code')
            ->assertJsonPath('data.reason', 'expired')
            ->assertJsonPath('data.message', 'This invite link has expired.');

        $this->postJson('/api/invites/expired-code/accept', $this->newAccount())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['invite' => 'This invite link has expired.']);
        $this->assertDatabaseMissing('users', ['email' => 'ana@example.com']);
    }

    public function test_a_guest_joins_the_department_through_the_link_once(): void
    {
        [, $company, $general] = $this->companyWithOwner();
        $invite = DepartmentInvite::factory()->for($general)->withCode('join-code')->create();

        $this->postJson('/api/invites/join-code/accept', $this->newAccount())
            ->assertCreated()
            ->assertJsonPath('data.role', 'employer')
            ->assertJsonPath('data.membership.role', 'hr')
            ->assertJsonPath('data.membership.department.name', 'General')
            ->assertJsonPath('data.membership.employer.id', $company->id);

        $user = User::firstWhere('email', 'ana@example.com');
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertNotNull($user->consented_at);
        $this->assertSame($user->id, $invite->fresh()->accepted_user_id);

        auth('web')->logout();
        $this->postJson('/api/invites/join-code/accept', $this->newAccount(['email' => 'ben@example.com']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['invite' => 'This invite link has already been used.']);
    }

    public function test_joining_follows_the_normal_account_rules(): void
    {
        [, , $general] = $this->companyWithOwner();
        DepartmentInvite::factory()->for($general)->withCode('join-code')->create();

        $this->postJson('/api/invites/join-code/accept', $this->newAccount(['password' => 'weak', 'password_confirmation' => 'weak', 'consent' => false]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password', 'consent']);
    }

    public function test_a_department_that_became_full_refuses_the_invite(): void
    {
        [, , $general] = $this->companyWithOwner(limit: 3);
        $this->hrOfficerIn($general);
        DepartmentInvite::factory()->for($general)->withCode('join-code')->create();
        AppSetting::put(AppSetting::HR_PER_DEPARTMENT_CAP, 1);

        $this->getJson('/api/invites/join-code')->assertJsonPath('data.reason', 'full');
        $this->postJson('/api/invites/join-code/accept', $this->newAccount())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['invite' => 'has no free places right now']);
    }

    public function test_a_logged_in_employer_without_a_profile_joins_with_their_account(): void
    {
        [, , $general] = $this->companyWithOwner();
        DepartmentInvite::factory()->for($general)->withCode('join-code')->create();
        $user = User::factory()->employer()->create();

        $this->actingAs($user, 'web')
            ->postJson('/api/invites/join-code/accept')
            ->assertOk()
            ->assertJsonPath('data.membership.role', 'hr');

        $this->assertSame(MemberRole::Hr, $user->fresh()->membership->role);
    }

    public function test_people_who_already_belong_somewhere_must_log_out_first(): void
    {
        [, , $general] = $this->companyWithOwner();
        DepartmentInvite::factory()->for($general)->withCode('join-code')->create();
        [$otherOwner] = $this->companyWithOwner();

        foreach ([User::factory()->create(), $otherOwner] as $user) {
            $this->actingAs($user, 'web')
                ->postJson('/api/invites/join-code/accept')
                ->assertStatus(409);
        }
    }

    public function test_used_invites_cannot_be_revoked_and_others_cannot_revoke(): void
    {
        [$owner, , $general] = $this->companyWithOwner();
        $used = DepartmentInvite::factory()->for($general)->used()->create();
        $open = DepartmentInvite::factory()->for($general)->create();

        $this->actingAs($owner, 'web')->deleteJson("/api/employer/invites/{$used->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['invite' => 'already been used']);

        [$otherOwner] = $this->companyWithOwner();
        $this->actingAs($otherOwner, 'web')->deleteJson("/api/employer/invites/{$open->id}")->assertForbidden();

        $this->actingAs($this->hrOfficerIn($general), 'web')
            ->postJson("/api/employer/departments/{$general->id}/invites")
            ->assertForbidden();
    }
}
