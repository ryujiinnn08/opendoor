<?php

namespace App\Http\Requests\Auth;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'role' => ['required', Rule::in(Role::selfRegistrable())],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'consent' => ['accepted'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.required' => 'Choose whether you are looking for a job or hiring.',
            'role.in' => 'Choose whether you are looking for a job or hiring.',
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

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => is_string($this->email) ? strtolower(trim($this->email)) : $this->email,
        ]);
    }
}
