<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\AccountFields;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Joining a department by invite. Guests create an account; a logged-in employer without
 * an employer profile joins with their existing account and sends no fields.
 */
class AcceptInviteRequest extends FormRequest
{
    use AccountFields;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->user() ? [] : $this->accountRules();
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return $this->accountMessages();
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeEmail();
    }
}
