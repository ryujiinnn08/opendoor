<?php

namespace Tests\Unit;

use App\Enums\EmploymentType;
use App\Enums\InterviewFormat;
use App\Enums\PostingStatus;
use App\Enums\WorkSetup;
use PHPUnit\Framework\TestCase;

class PostingStatusTest extends TestCase
{
    public function test_allowed_stored_status_changes_follow_the_life_cycle(): void
    {
        $allowed = [
            'draft' => ['pending'],
            'pending' => ['open', 'rejected'],
            'rejected' => ['pending'],
            'open' => ['pending', 'closed'],
            'closed' => ['open', 'pending'],
        ];

        foreach (PostingStatus::cases() as $from) {
            foreach (PostingStatus::cases() as $to) {
                $this->assertSame(
                    in_array($to->value, $allowed[$from->value], true),
                    $from->canTransitionTo($to),
                    "{$from->value} to {$to->value}",
                );
            }
        }
    }

    public function test_labels_use_plain_language(): void
    {
        $this->assertSame('Waiting for approval', PostingStatus::Pending->label());
        $this->assertSame('Full-time', EmploymentType::FullTime->label());
        $this->assertSame('On-site', WorkSetup::OnSite->label());
        $this->assertSame('Online or on-site', InterviewFormat::OnlineOrOnSite->label());
    }
}
