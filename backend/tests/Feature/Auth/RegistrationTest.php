<?php

namespace Tests\Feature\Auth;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function validData(array $overrides = []): array
    {
        return array_merge([
            'role' => 'candidate',
            'name' => 'Maria Santos',
            'email' => 'maria@example.com',
            'password' => 'Secure@123',
            'password_confirmation' => 'Secure@123',
            'consent' => true,
        ], $overrides);
    }

    #[DataProvider('registrableRoles')]
    public function test_job_seekers_and_employers_can_register_and_are_logged_in(string $role): void
    {
        $response = $this->postJson('/api/register', $this->validData(['role' => $role]));

        $response->assertCreated()
            ->assertJsonPath('data.role', $role)
            ->assertJsonPath('data.email', 'maria@example.com')
            ->assertJsonMissingPath('data.password');

        $user = User::firstWhere('email', 'maria@example.com');
        $this->assertSame($role, $user->role->value);
        $this->assertNotNull($user->consented_at);
        $this->assertTrue($user->is_active);
        $this->assertAuthenticatedAs($user, 'web');
    }

    public static function registrableRoles(): array
    {
        return ['candidate' => ['candidate'], 'employer' => ['employer']];
    }

    public function test_nobody_can_register_as_an_admin(): void
    {
        $this->postJson('/api/register', $this->validData(['role' => Role::Admin->value]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_privacy_consent_is_required(): void
    {
        $this->postJson('/api/register', $this->validData(['consent' => false]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['consent' => 'You need to agree to the privacy notice']);
    }

    public function test_email_must_be_unique(): void
    {
        User::factory()->create(['email' => 'maria@example.com']);

        $this->postJson('/api/register', $this->validData(['email' => 'Maria@Example.com']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'An account with this email already exists']);
    }

    #[DataProvider('weakPasswords')]
    public function test_weak_passwords_are_rejected(string $password, string $expectedMessage): void
    {
        $this->postJson('/api/register', $this->validData([
            'password' => $password,
            'password_confirmation' => $password,
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password' => $expectedMessage]);

        $this->assertDatabaseCount('users', 0);
    }

    public static function weakPasswords(): array
    {
        return [
            'too short' => ['Ab@1', 'Use at least 8 characters.'],
            'no uppercase' => ['secure@123', 'Add an uppercase letter'],
            'no lowercase' => ['SECURE@123', 'Add an uppercase letter'],
            'no number' => ['Secure@abc', 'Add a number'],
            'no special character' => ['Secure1234', 'Add a special character'],
        ];
    }

    public function test_password_confirmation_must_match(): void
    {
        $this->postJson('/api/register', $this->validData(['password_confirmation' => 'Different@123']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password' => 'The two passwords do not match.']);
    }
}
