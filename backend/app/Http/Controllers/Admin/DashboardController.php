<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EmployerType;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Accommodation;
use App\Models\Category;
use App\Models\Employer;
use App\Services\TeamCapacity;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function show(TeamCapacity $capacity): JsonResponse
    {
        return response()->json(['data' => [
            'categories' => Category::count(),
            'active_accommodations' => Accommodation::active()->count(),
            'companies_waiting_for_verification' => Employer::where('type', EmployerType::Company)
                ->where('verification_status', VerificationStatus::Pending)
                ->count(),
            'hr_per_department_cap' => $capacity->cap(),
        ]]);
    }
}
