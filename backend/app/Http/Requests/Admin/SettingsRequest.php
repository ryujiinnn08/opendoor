<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SettingsRequest extends FormRequest
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
            'hr_per_department_cap' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'hr_per_department_cap.required' => 'Enter the maximum number of HR officers per department.',
            'hr_per_department_cap.integer' => 'Enter a whole number.',
            'hr_per_department_cap.min' => 'The maximum must be at least 1.',
            'hr_per_department_cap.max' => 'The maximum can be at most 100.',
        ];
    }
}
