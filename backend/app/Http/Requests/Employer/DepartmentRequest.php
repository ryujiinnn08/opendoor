<?php

namespace App\Http\Requests\Employer;

use App\Models\Department;
use App\Services\TeamCapacity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    private function department(): ?Department
    {
        return $this->route('department');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $employerId = $this->department()?->employer_id ?? $this->user()->membership?->employer_id;

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('departments', 'name')
                    ->where('employer_id', $employerId)
                    ->ignore($this->department()),
            ],
            'member_limit' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Limit checks need the platform cap and the department's current places.
     *
     * @return array<int, callable>
     */
    public function after(TeamCapacity $capacity): array
    {
        return [
            function (Validator $validator) use ($capacity) {
                $limit = $this->input('member_limit');
                $department = $this->department();

                if ($limit === null || $validator->errors()->has('member_limit')) {
                    return;
                }

                // An unchanged limit is fine even if it is above a cap that was lowered later.
                if ($department && (int) $limit === $department->member_limit) {
                    return;
                }

                $cap = $capacity->cap();
                if ($limit > $cap) {
                    $validator->errors()->add('member_limit', "OpenDoor allows at most {$cap} HR officers per department.");

                    return;
                }

                if ($department && $limit < ($used = $capacity->placesUsed($department))) {
                    $validator->errors()->add(
                        'member_limit',
                        "{$department->name} is using {$used} places (HR officers and unused invites). Move or remove people, or revoke invites, before lowering the limit below {$used}.",
                    );
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter a department name.',
            'name.max' => 'Use 100 characters or fewer.',
            'name.unique' => 'Your company already has a department with this name.',
            'member_limit.integer' => 'Enter a whole number for the limit.',
            'member_limit.min' => 'The limit must be at least 1.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->name)) {
            $this->merge(['name' => trim($this->name)]);
        }
    }
}
