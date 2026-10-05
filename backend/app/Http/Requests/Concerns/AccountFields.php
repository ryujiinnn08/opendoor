<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Validation\Rules\Password;

/**
 * Name, email, password and privacy consent: shared by registration and joining by invite.
 */
trait AccountFields
{
    /**
     * @return array<string, mixed>
     */
    protected function accountRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'consent' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function accountMessages(): array
    {
        return [
            'name.required' => 'Enter your full name.',
            'email.required' => 'Enter your email address.',
            'email.email' => 'Enter an email address in the correct format, like name@example.com.',
            'email.lowercase' => 'Enter your email address in lowercase letters.',
            'email.unique' => 'An account with this email already exists. Try logging in instead.',
            'password.required' => 'Enter a password.',
            'password.confirmed' => 'The two passwords do not match.',
            'password.min' => 'Use at least 8 characters.',
            'consent.accepted' => 'You need to agree to the privacy notice to create an account.',
        ];
    }

    protected function normalizeEmail(): void
    {
        $this->merge([
            'email' => is_string($this->email) ? strtolower(trim($this->email)) : $this->email,
        ]);
    }
}
