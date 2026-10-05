<?php

namespace App\Http\Controllers\Employer;

use App\Enums\PostingStatus;
use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Posting counts by the status people see: the whole company for owners, their own
     * department for HR officers.
     */
    public function show(Request $request): JsonResponse
    {
        $counts = collect(PostingStatus::cases())->mapWithKeys(fn (PostingStatus $status) => [
            $status->value => JobPosting::visibleTo($request->user())->inDisplayStatus($status)->count(),
        ]);

        return response()->json(['data' => ['postings' => $counts]]);
    }
}
