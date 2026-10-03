<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Used by the React app (and deploy checks) to confirm the API and database are reachable.
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $database = 'ok';
    } catch (\Throwable) {
        $database = 'unavailable';
    }

    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
        'database' => $database,
        'time' => now()->toIso8601String(),
    ]);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
