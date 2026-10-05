<?php

namespace Database\Factories;

use App\Enums\EmploymentType;
use App\Enums\InterviewFormat;
use App\Enums\PostingStatus;
use App\Enums\WorkSetup;
use App\Models\Category;
use App\Models\Department;
use App\Models\Employer;
use App\Models\JobPosting;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobPosting>
 */
class JobPostingFactory extends Factory
{
    /**
     * A complete draft: every field filled, not submitted yet.
     */
    public function definition(): array
    {
        return [
            'employer_id' => Employer::factory(),
            'category_id' => Category::factory(),
            'title' => fake()->jobTitle(),
            'description' => fake()->paragraph(),
            'location' => fake()->city(),
            'employment_type' => EmploymentType::FullTime,
            'work_setup' => WorkSetup::OnSite,
            'interview_format' => InterviewFormat::Online,
            'closes_on' => self::daysFromToday(30),
            'status' => PostingStatus::Draft,
        ];
    }

    /**
     * A posting in this department (and its company), or of this employer with no department.
     */
    public function in(Department|Employer $place): static
    {
        return $this->state(fn () => $place instanceof Department
            ? ['employer_id' => $place->employer_id, 'department_id' => $place->id]
            : ['employer_id' => $place->id, 'department_id' => null]);
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => PostingStatus::Pending, 'submitted_at' => now()]);
    }

    public function open(): static
    {
        return $this->state(fn () => [
            'status' => PostingStatus::Open,
            'submitted_at' => now()->subDays(2),
            'approved_at' => now()->subDay(),
        ]);
    }

    public function rejected(string $reason = 'Describe the duties in more detail.'): static
    {
        return $this->state(fn () => [
            'status' => PostingStatus::Rejected,
            'submitted_at' => now()->subDay(),
            'rejection_reason' => $reason,
        ]);
    }

    public function closed(): static
    {
        return $this->open()->state(fn () => ['status' => PostingStatus::Closed]);
    }

    /**
     * Open, but its closing date was yesterday, so it is shown as Closed.
     */
    public function expired(): static
    {
        return $this->open()->state(fn () => ['closes_on' => self::daysFromToday(-1)]);
    }

    private static function daysFromToday(int $days): string
    {
        return CarbonImmutable::parse(JobPosting::today())->addDays($days)->toDateString();
    }
}
