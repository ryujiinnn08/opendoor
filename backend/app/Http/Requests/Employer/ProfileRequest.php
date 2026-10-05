<?php

namespace App\Http\Requests\Employer;

use Illuminate\Foundation\Http\FormRequest;

class ProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    private function isCompany(): bool
    {
        return (bool) $this->user()->membership?->employer->isCompany();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'industry' => [$this->isCompany() ? 'required' : 'nullable', 'string', 'max:100'],
            'address' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $company = $this->isCompany();

        return [
            'name.required' => $company ? 'Enter the company name.' : 'Enter the name job seekers will see.',
            'name.max' => 'Use 200 characters or fewer.',
            'industry.required' => 'Enter the company\'s industry.',
            'address.required' => $company ? 'Enter the company address.' : 'Enter your city or municipality.',
            'description.max' => 'Use 2,000 characters or fewer.',
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'industry', 'address', 'description'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field))]);
            }
        }
    }
}
