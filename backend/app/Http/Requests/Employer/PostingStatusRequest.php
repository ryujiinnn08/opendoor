<?php

namespace App\Http\Requests\Employer;

use App\Rules\ClosingDate;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/**
 * Close, reopen, or change the closing date of a posting. Reopening and changing the date
 * need a new closing date but no approval (decisions 7 and 25).
 */
class PostingStatusRequest extends FormRequest
{
    /**
     * Other departments and companies are refused before the input is checked.
     */
    public function authorize(): Response
    {
        return Gate::inspect('manage', $this->route('posting'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'action' => ['required', 'in:close,reopen,change_closing_date'],
            'closes_on' => ['required_unless:action,close', 'nullable', new ClosingDate],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'action.required' => 'Choose close, reopen or change_closing_date.',
            'action.in' => 'Choose close, reopen or change_closing_date.',
            'closes_on.required_unless' => 'Choose a new closing date.',
        ];
    }
}
