<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_log_in_and_receive_their_role(): void
    {
        $user = User::factory()->employer()->create(['email' => 'hr@example.com']);

        $this->postJson('/api/login', ['email' => 'hr@example.com', 'password' => 'Password@123'])
            ->assertOk()
            ->assertJsonPath('data.role', 'employer')
            ->assertJsonMissingPath('data.password');

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_wrong_password_is_rejected_with_a_plain_message(): void
    {
        User::factory()->create(['email' => 'maria@example.com']);

        $this->postJson('/api/login', ['email' => 'maria@example.com', 'password' => 'Wrong@123'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'These details do not match our records']);

        $this->assertGuest('web');
    }

    public function test_suspended_users_cannot_log_in(): void
    {
        User::factory()->suspended()->create(['email' => 'maria@example.com']);

        $this->postJson('/api/login', ['email' => 'maria@example.com', 'password' => 'Password@123'])
            ->assertForbidden()
            ->assertJsonPath('message', 'This account has been suspended. Contact the OpenDoor administrators for help.');

        $this->assertGuest('web');
    }

    public function test_login_is_blocked_after_five_failed_attempts_in_a_minute(): void
    {
        User::factory()->create(['email' => 'maria@example.com']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'maria@example.com', 'password' => 'Wrong@123'])
                ->assertUnprocessable();
        }

        // Even the correct password is refused until the minute is over.
        $this->postJson('/api/login', ['email' => 'maria@example.com', 'password' => 'Password@123'])
            ->assertStatus(429)
            ->assertJsonValidationErrors(['email' => 'Too many login attempts']);

        $this->assertGuest('web');
    }
}
