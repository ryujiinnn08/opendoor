<?php

namespace App\Http\Controllers\Public;

use App\Enums\AccommodationGroup;
use App\Http\Controllers\Controller;
use App\Http\Resources\AccommodationResource;
use App\Models\Accommodation;
use Illuminate\Http\JsonResponse;

class AccommodationController extends Controller
{
    /**
     * Active accommodation types grouped for pickers and filters:
     * { data: [ { group: "Physical access", accommodations: [ ... ] }, ... ] }
     */
    public function index(): JsonResponse
    {
        $groups = Accommodation::active()
            ->orderBy('name')
            ->get()
            ->groupBy('group_name')
            ->sortBy(fn ($items, $group) => [AccommodationGroup::sortOrder($group), $group])
            ->map(fn ($items, $group) => [
                'group' => $group,
                'accommodations' => AccommodationResource::collection($items),
            ])
            ->values();

        return response()->json(['data' => $groups]);
    }
}
