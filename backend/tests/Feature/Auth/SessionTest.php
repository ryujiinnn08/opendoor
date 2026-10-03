<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_get_401_from_me(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_me_returns_the_logged_in_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'candidate');
    }

    public function test_logout_ends_the_session(): void
    {
        User::factory()->create(['email' => 'maria@example.com']);
        $this->postJson('/api/login', ['email' => 'maria@example.com', 'password' => 'Password@123'])->assertOk();

        $this->postJson('/api/logout')->assertNoContent();

        $this->assertGuest('web');
    }

    public function test_a_suspended_user_is_logged_out_on_their_next_request(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web')->getJson('/api/me')->assertOk();

        $user->forceFill(['is_active' => false])->save();

        $this->getJson('/api/me')->assertForbidden();
        $this->assertGuest('web');
    }
}
