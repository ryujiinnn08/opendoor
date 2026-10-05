<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\JobPosting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function store(CategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $category->update($request->validated());

        return new CategoryResource($category);
    }

    /**
     * A category used by any posting, even a deleted one, can't be deleted (spec F11.1,
     * plan PHASE_2 decision 32); renaming is always allowed.
     */
    public function destroy(Category $category): Response
    {
        if (JobPosting::withTrashed()->where('category_id', $category->id)->exists()) {
            throw ValidationException::withMessages([
                'category' => "\"{$category->name}\" is used by job postings, so it can't be deleted. Rename it instead.",
            ]);
        }

        $category->delete();

        return response()->noContent();
    }
}
