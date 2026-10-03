<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AccommodationRequest extends FormRequest
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
            'name' => [
                'required', 'string', 'max:150',
                Rule::unique('accommodations', 'name')->ignore($this->route('accommodation')),
            ],
            'group_name' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter a name for the accommodation type.',
            'name.max' => 'Use 150 characters or fewer.',
            'name.unique' => 'An accommodation type with this name already exists.',
            'group_name.required' => 'Choose or enter a group.',
            'group_name.max' => 'Use 50 characters or fewer for the group.',
            'description.max' => 'Use 500 characters or fewer for the description.',
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'group_name', 'description'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field))]);
            }
        }
    }
}
