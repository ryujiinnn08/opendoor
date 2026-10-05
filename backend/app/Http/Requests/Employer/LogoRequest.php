<?php

namespace App\Http\Requests\Employer;

use Illuminate\Foundation\Http\FormRequest;

class LogoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * SVG is not accepted: it can carry scripts.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'logo' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'logo.required' => 'Choose an image file.',
            'logo.file' => 'Choose an image file.',
            'logo.mimes' => 'The logo must be a PNG, JPG or WebP image.',
            'logo.max' => 'The logo must be smaller than 2 MB.',
            'logo.uploaded' => 'The logo must be smaller than 2 MB.',
        ];
    }
}
