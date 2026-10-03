<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AccommodationGroup;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AccommodationRequest;
use App\Http\Resources\AccommodationResource;
use App\Models\Accommodation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Accommodation types are retired, never deleted, so existing postings and feedback stay valid.
 */
class AccommodationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $accommodations = Accommodation::orderBy('name')
            ->get()
            ->sortBy(fn (Accommodation $item) => AccommodationGroup::sortOrder($item->group_name))
            ->values();

        return AccommodationResource::collection($accommodations);
    }

    public function store(AccommodationRequest $request): JsonResponse
    {
        $accommodation = Accommodation::create($request->validated());

        return (new AccommodationResource($accommodation))->response()->setStatusCode(201);
    }

    public function update(AccommodationRequest $request, Accommodation $accommodation): AccommodationResource
    {
        $accommodation->update($request->validated());

        return new AccommodationResource($accommodation);
    }

    public function updateStatus(Request $request, Accommodation $accommodation): AccommodationResource
    {
        $validated = $request->validate(
            ['is_active' => ['required', 'boolean']],
            ['is_active.required' => 'Choose whether the accommodation type is active or retired.'],
        );

        $accommodation->update($validated);

        return new AccommodationResource($accommodation);
    }
}
