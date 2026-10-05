<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\LogoRequest;
use App\Http\Resources\EmployerResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

/**
 * Logos are stored on the private "local" disk and served by EmployerLogoController,
 * so no storage:link symlink is needed (plan PHASE_2 decision 8).
 */
class LogoController extends Controller
{
    public function store(LogoRequest $request): EmployerResource
    {
        $employer = $request->user()->membership->employer;
        Gate::authorize('update', $employer);

        $path = $request->file('logo')->store('logos', 'local');
        $this->deleteFile($employer->logo_path);
        $employer->forceFill(['logo_path' => $path])->save();

        return new EmployerResource($employer);
    }

    public function destroy(Request $request): EmployerResource
    {
        $employer = $request->user()->membership->employer;
        Gate::authorize('update', $employer);

        $this->deleteFile($employer->logo_path);
        $employer->forceFill(['logo_path' => null])->save();

        return new EmployerResource($employer);
    }

    private function deleteFile(?string $path): void
    {
        if ($path) {
            Storage::disk('local')->delete($path);
        }
    }
}
