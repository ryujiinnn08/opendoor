<?php

namespace Tests\Concerns;

use App\Models\Accommodation;
use App\Models\Category;
use App\Rules\ClosingDate;

trait BuildsPostings
{
    /**
     * A posting payload with every field filled and two active accommodations, ready to submit.
     */
    protected function completePosting(array $overrides = []): array
    {
        $accommodations = Accommodation::factory()->count(2)->create();

        return array_merge([
            'title' => 'Junior Web Developer',
            'description' => 'Build and look after our accessible web apps with a small, friendly team.',
            'category_id' => Category::factory()->create()->id,
            'location' => 'Anywhere in the Philippines',
            'employment_type' => 'full_time',
            'work_setup' => 'remote',
            'interview_format' => 'online',
            'closes_on' => ClosingDate::earliest()->addDays(29)->toDateString(),
            'accommodations' => $accommodations->map(fn (Accommodation $item) => ['id' => $item->id, 'note' => null])->all(),
            'submit' => true,
        ], $overrides);
    }
}
