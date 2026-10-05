<?php

namespace App\Http\Requests\Employer;

use App\Enums\EmploymentType;
use App\Enums\InterviewFormat;
use App\Enums\PostingStatus;
use App\Enums\WorkSetup;
use App\Models\Accommodation;
use App\Models\JobPosting;
use App\Rules\ClosingDate;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Creating or saving a job posting. A draft needs only a title (plus a department for company
 * postings); submitting, or saving a posting that is waiting, open or closed, needs every field
 * and at least one accommodation (decisions 5, 24, 26 and 28).
 */
class JobPostingRequest extends FormRequest
{
    private const FIELDS = [
        'title', 'department_id', 'category_id', 'description', 'location',
        'employment_type', 'work_setup', 'interview_format', 'closes_on',
    ];

    /**
     * Other departments and companies are refused before the input is checked.
     */
    public function authorize(): Response|bool
    {
        $posting = $this->posting();

        return $posting ? Gate::inspect('manage', $posting) : true;
    }

    public function submitting(): bool
    {
        return $this->boolean('submit')
            || in_array($this->posting()?->status, [PostingStatus::Pending, PostingStatus::Open, PostingStatus::Closed], true);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $required = $this->submitting() ? 'required' : 'nullable';
        $member = $this->user()->membership;

        $rules = [
            'title' => ['required', 'string', 'max:150'],
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'description' => [$required, 'string', 'max:5000'],
            'location' => [$required, 'string', 'max:150'],
            'employment_type' => [$required, Rule::in(array_column(EmploymentType::cases(), 'value'))],
            'work_setup' => [$required, Rule::in(array_column(WorkSetup::cases(), 'value'))],
            'interview_format' => [$required, Rule::in(array_column(InterviewFormat::cases(), 'value'))],
            'closes_on' => $this->submitting() ? ['required', new ClosingDate] : ['nullable', 'date_format:Y-m-d'],
            'accommodations' => [$required, 'array', $this->submitting() ? 'min:1' : 'min:0'],
            'accommodations.*.id' => ['required', 'integer', 'distinct', 'exists:accommodations,id'],
            'accommodations.*.note' => ['nullable', 'string', 'max:255'],
            'submit' => ['sometimes', 'boolean'],
        ];

        // Only company owners choose; HR officers and individual employers never send one that counts.
        if ($member->isOwner() && $member->employer->isCompany()) {
            $rules['department_id'] = [
                'required', 'integer',
                Rule::exists('departments', 'id')->where('employer_id', $member->employer_id),
            ];
        }

        return $rules;
    }

    /**
     * A retired accommodation may stay on a posting that already has it, but can't be added
     * (decision 31).
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $items = $this->input('accommodations');
                if (! is_array($items)) {
                    return;
                }

                $ids = collect($items)
                    ->map(fn ($item) => is_array($item) ? ($item['id'] ?? null) : null)
                    ->filter(fn ($id) => is_numeric($id));
                $retired = Accommodation::whereIn('id', $ids)->where('is_active', false)->get()->keyBy('id');
                $attached = $this->posting()?->accommodations()->pluck('accommodations.id')->all() ?? [];

                foreach ($items as $index => $item) {
                    $accommodation = $retired->get(is_array($item) ? (int) ($item['id'] ?? 0) : 0);

                    if ($accommodation && ! in_array($accommodation->id, $attached, true)) {
                        $validator->errors()->add(
                            "accommodations.{$index}.id",
                            "\"{$accommodation->name}\" is no longer offered. Untick it to continue.",
                        );
                    }
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $accommodations = 'Choose at least one accommodation your workplace provides.';
        $fromList = 'Choose accommodations from the list.';

        return [
            'title.required' => 'Enter a job title.',
            'title.max' => 'Use 150 characters or fewer.',
            'department_id.required' => 'Choose the department this job is in.',
            'department_id.integer' => "Choose one of your company's departments.",
            'department_id.exists' => "Choose one of your company's departments.",
            'category_id.required' => 'Choose a category.',
            'category_id.integer' => 'Choose a category from the list.',
            'category_id.exists' => 'Choose a category from the list.',
            'description.required' => 'Describe the job.',
            'description.max' => 'Use 5,000 characters or fewer.',
            'location.required' => 'Enter where the job is, e.g., "Makati City" or "Anywhere in the Philippines".',
            'location.max' => 'Use 150 characters or fewer.',
            'employment_type.required' => 'Choose the employment type.',
            'employment_type.in' => 'Choose the employment type.',
            'work_setup.required' => 'Choose the work setup.',
            'work_setup.in' => 'Choose the work setup.',
            'interview_format.required' => 'Choose how interviews are held.',
            'interview_format.in' => 'Choose how interviews are held.',
            'closes_on.required' => 'Choose a closing date.',
            'closes_on.date_format' => 'Enter the closing date as a full date.',
            'accommodations.required' => $accommodations,
            'accommodations.array' => $accommodations,
            'accommodations.min' => $accommodations,
            'accommodations.*.id.required' => $fromList,
            'accommodations.*.id.integer' => $fromList,
            'accommodations.*.id.exists' => $fromList,
            'accommodations.*.id.distinct' => 'Each accommodation can be chosen only once.',
            'accommodations.*.note.max' => 'Use 255 characters or fewer for each note.',
        ];
    }

    /**
     * The validated posting fields, without the accommodations and the submit flag.
     *
     * @return array<string, mixed>
     */
    public function postingFields(): array
    {
        return collect($this->validated())->only(self::FIELDS)->all();
    }

    /**
     * The chosen accommodations with trimmed notes (blank notes become null), or null when
     * the request didn't send the list.
     *
     * @return list<array{id: int, note: ?string}>|null
     */
    public function accommodationList(): ?array
    {
        $items = $this->validated('accommodations');

        if ($items === null) {
            return null;
        }

        return collect($items)->map(function (array $item) {
            $note = trim((string) ($item['note'] ?? ''));

            return ['id' => (int) $item['id'], 'note' => $note === '' ? null : $note];
        })->values()->all();
    }

    private function posting(): ?JobPosting
    {
        return $this->route('posting');
    }
}
