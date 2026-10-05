<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Approve or reject (with a reason). Used for company verification, and for postings in Phase 2B.
 */
class DecisionRequest extends FormRequest
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
            'decision' => ['required', 'in:approve,reject'],
            'reason' => ['nullable', 'required_if:decision,reject', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'decision.required' => 'Choose approve or reject.',
            'decision.in' => 'Choose approve or reject.',
            'reason.required_if' => 'Give a reason so they know what to fix.',
            'reason.max' => 'Use 500 characters or fewer.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->reason)) {
            $this->merge(['reason' => trim($this->reason)]);
        }
    }
}
