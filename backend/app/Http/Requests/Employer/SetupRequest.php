<?php

namespace App\Http\Requests\Employer;

use App\Enums\EmployerType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SetupRequest extends FormRequest
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
            'type' => ['required', Rule::enum(EmployerType::class)],
            'name' => ['required', 'string', 'max:200'],
            'industry' => ['nullable', 'required_if:type,company', 'string', 'max:100'],
            'address' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $company = $this->input('type') === EmployerType::Company->value;

        return [
            'type.required' => 'Choose whether you are hiring for a company or for yourself.',
            'type.enum' => 'Choose whether you are hiring for a company or for yourself.',
            'name.required' => $company ? 'Enter the company name.' : 'Enter the name job seekers will see.',
            'name.max' => 'Use 200 characters or fewer.',
            'industry.required_if' => 'Enter the company\'s industry.',
            'address.required' => $company ? 'Enter the company address.' : 'Enter your city or municipality.',
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'industry', 'address'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field))]);
            }
        }
    }
}
