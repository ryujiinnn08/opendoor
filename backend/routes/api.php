<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth\AuthController;
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

// Authentication (M1). Login is additionally rate-limited per email inside LoginRequest.
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('active')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);

        Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
            Route::apiResource('categories', Admin\CategoryController::class)->only(['store', 'update', 'destroy']);

            Route::apiResource('accommodations', Admin\AccommodationController::class)->only(['index', 'store', 'update']);
            Route::patch('accommodations/{accommodation}/status', [Admin\AccommodationController::class, 'updateStatus']);
        });
    });
});
