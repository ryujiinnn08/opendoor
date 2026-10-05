<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Employer;
use App\Http\Controllers\Public;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Used by the React app (and deploy checks) to confirm the API and database are reachable.
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $database = 'ok';
    } catch (Throwable) {
        $database = 'unavailable';
    }

    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
        'database' => $database,
        'time' => now()->toIso8601String(),
    ]);
});

// Public lists used by forms and filters (M11).
Route::get('/categories', [Public\CategoryController::class, 'index']);
Route::get('/accommodations', [Public\AccommodationController::class, 'index']);

// Employer logos (M3) and team invites (Phase 2A).
Route::get('/employers/{employer}/logo', [Public\EmployerLogoController::class, 'show'])->name('employers.logo');
Route::get('/invites/{code}', [Public\InviteController::class, 'show'])->middleware('throttle:30,1');
Route::post('/invites/{code}/accept', [Public\InviteController::class, 'accept'])->middleware('throttle:10,1');

// Authentication (M1). Login is additionally rate-limited per email inside LoginRequest.
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('active')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);

        // Employer portal (M3): company or individual profile, verification and team.
        Route::middleware('role:employer')->prefix('employer')->group(function () {
            Route::post('setup', [Employer\SetupController::class, 'store']);

            Route::middleware('employer.profile')->group(function () {
                Route::get('profile', [Employer\ProfileController::class, 'show']);
                Route::put('profile', [Employer\ProfileController::class, 'update']);
                Route::post('profile/logo', [Employer\LogoController::class, 'store']);
                Route::delete('profile/logo', [Employer\LogoController::class, 'destroy']);
                Route::post('verification', [Employer\VerificationController::class, 'store']);

                Route::get('departments', [Employer\DepartmentController::class, 'index']);
                Route::post('departments', [Employer\DepartmentController::class, 'store']);
                Route::put('departments/{department}', [Employer\DepartmentController::class, 'update']);
                Route::delete('departments/{department}', [Employer\DepartmentController::class, 'destroy']);
                Route::post('departments/{department}/invites', [Employer\InviteController::class, 'store']);
                Route::delete('invites/{invite}', [Employer\InviteController::class, 'destroy']);
                Route::patch('members/{member}', [Employer\MemberController::class, 'update']);
                Route::delete('members/{member}', [Employer\MemberController::class, 'destroy']);

                // Job postings (M4, Phase 2B): department-scoped by JobPostingPolicy.
                Route::get('dashboard', [Employer\DashboardController::class, 'show']);
                Route::get('job-postings', [Employer\JobPostingController::class, 'index']);
                Route::post('job-postings', [Employer\JobPostingController::class, 'store']);
                Route::get('job-postings/{posting}', [Employer\JobPostingController::class, 'show']);
                Route::put('job-postings/{posting}', [Employer\JobPostingController::class, 'update']);
                Route::delete('job-postings/{posting}', [Employer\JobPostingController::class, 'destroy']);
                Route::patch('job-postings/{posting}/status', [Employer\JobPostingStatusController::class, 'update']);
            });
        });

        Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
            Route::get('dashboard', [Admin\DashboardController::class, 'show']);

            Route::apiResource('categories', Admin\CategoryController::class)->only(['store', 'update', 'destroy']);

            Route::apiResource('accommodations', Admin\AccommodationController::class)->only(['index', 'store', 'update']);
            Route::patch('accommodations/{accommodation}/status', [Admin\AccommodationController::class, 'updateStatus']);

            Route::get('employers', [Admin\EmployerVerificationController::class, 'index']);
            Route::patch('employers/{employer}/verify', [Admin\EmployerVerificationController::class, 'update']);

            Route::get('job-postings', [Admin\JobPostingApprovalController::class, 'index']);
            Route::get('job-postings/{posting}', [Admin\JobPostingApprovalController::class, 'show']);
            Route::patch('job-postings/{posting}/approve', [Admin\JobPostingApprovalController::class, 'update']);

            Route::get('settings', [Admin\SettingsController::class, 'show']);
            Route::put('settings', [Admin\SettingsController::class, 'update']);
        });
    });
});
