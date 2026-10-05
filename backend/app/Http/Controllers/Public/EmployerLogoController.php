<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Employer;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployerLogoController extends Controller
{
    /**
     * Streams an employer's logo from private storage. (Phase 7: redirect to Cloudflare R2.)
     */
    public function show(Employer $employer): StreamedResponse
    {
        $disk = Storage::disk('local');

        abort_unless($employer->logo_path && $disk->exists($employer->logo_path), 404);

        return $disk->response($employer->logo_path, null, [
            'Cache-Control' => 'public, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
