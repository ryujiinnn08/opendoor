<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Employer routes that need a company or individual profile answer 409 until the user
 * has one; the React app then shows the "Set up your employer profile" screen.
 */
class EnsureEmployerProfile
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->membership === null) {
            return response()->json([
                'message' => 'Set up your employer profile first.',
                'code' => 'employer_profile_required',
            ], 409);
        }

        return $next($request);
    }
}
