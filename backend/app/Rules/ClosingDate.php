<?php

namespace App\Rules;

use App\Models\JobPosting;
use Carbon\CarbonImmutable;
use Closure;
use DateTimeImmutable;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * A closing date between tomorrow and six months ahead, in Philippine time
 * (plan PHASE_2 decisions 11 and 29).
 */
class ClosingDate implements ValidationRule
{
    public static function earliest(): CarbonImmutable
    {
        return CarbonImmutable::parse(JobPosting::today())->addDay();
    }

    /**
     * Six months after August 31 is February 28 (or 29), never a day in March.
     */
    public static function latest(): CarbonImmutable
    {
        return CarbonImmutable::parse(JobPosting::today())
            ->addMonthsNoOverflow((int) config('opendoor.postings.max_months_ahead'));
    }

    public static function message(): string
    {
        return sprintf(
            'Choose a closing date between %s and %s.',
            self::earliest()->format('F j, Y'),
            self::latest()->format('F j, Y'),
        );
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $date = is_string($value) ? DateTimeImmutable::createFromFormat('!Y-m-d', $value) : false;

        // "2026-02-30" parses as March 2, so a real date must format back to itself.
        if ($date === false
            || $date->format('Y-m-d') !== $value
            || $value < self::earliest()->toDateString()
            || $value > self::latest()->toDateString()) {
            $fail(self::message());
        }
    }
}
