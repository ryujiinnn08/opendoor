<?php

namespace App\Http\Requests\Employer;

use App\Enums\RegistrationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Formats differ between DTI, SEC and CDA, so only the characters and length are checked;
     * an admin checks the number itself (plan PHASE_2 decision 9).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'registration_type' => ['required', Rule::enum(RegistrationType::class)],
            'business_reg_no' => ['required', 'string', 'regex:/^[A-Z0-9-]{5,20}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'registration_type.required' => 'Choose the agency your business is registered with.',
            'registration_type.enum' => 'Choose the agency your business is registered with.',
            'business_reg_no.required' => 'Enter the registration number.',
            'business_reg_no.regex' => 'Enter 5 to 20 letters, numbers or dashes, exactly as on your certificate.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->business_reg_no)) {
            $this->merge(['business_reg_no' => strtoupper(preg_replace('/\s+/', '', $this->business_reg_no))]);
        }
    }
}
