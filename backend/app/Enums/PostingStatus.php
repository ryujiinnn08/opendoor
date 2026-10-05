<?php

namespace App\Enums;

/**
 * The stored status of a job posting (plan PHASE_2 §4.4). "Closed automatically" is not
 * stored: an open posting whose closing date has passed is shown as Closed.
 */
enum PostingStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Open = 'open';
    case Rejected = 'rejected';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Pending => 'Waiting for approval',
            self::Open => 'Open',
            self::Rejected => 'Rejected',
            self::Closed => 'Closed',
        };
    }

    /**
     * Stored status changes made by employers and admins. Saving a waiting posting and
     * changing an open posting's closing date keep the same status, so they are not listed.
     */
    public function canTransitionTo(self $next): bool
    {
        return in_array($next, match ($this) {
            self::Draft => [self::Pending],
            self::Pending => [self::Open, self::Rejected],
            self::Rejected => [self::Pending],
            self::Open => [self::Pending, self::Closed],
            self::Closed => [self::Open, self::Pending],
        }, true);
    }
}
