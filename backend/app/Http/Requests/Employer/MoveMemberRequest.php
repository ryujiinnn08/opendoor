<?php

namespace App\Http\Requests\Employer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MoveMemberRequest extends FormRequest
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
            'department_id' => [
                'required', 'integer',
                Rule::exists('departments', 'id')->where('employer_id', $this->route('member')->employer_id),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'department_id.required' => 'Choose a department.',
            'department_id.exists' => 'Choose one of your company\'s departments.',
        ];
    }
}
