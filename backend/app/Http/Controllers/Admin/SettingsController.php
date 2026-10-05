<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SettingsRequest;
use App\Models\AppSetting;
use App\Services\TeamCapacity;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function show(TeamCapacity $capacity): JsonResponse
    {
        return response()->json(['data' => ['hr_per_department_cap' => $capacity->cap()]]);
    }

    /**
     * Lowering the cap keeps existing members; full departments just can't invite more.
     */
    public function update(SettingsRequest $request, TeamCapacity $capacity): JsonResponse
    {
        AppSetting::put(AppSetting::HR_PER_DEPARTMENT_CAP, $request->validated('hr_per_department_cap'));

        return $this->show($capacity);
    }
}
