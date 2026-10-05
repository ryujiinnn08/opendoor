<?php

namespace App\Enums;

enum VerificationStatus: string
{
    case NotSubmitted = 'not_submitted';
    case Pending = 'pending';
    case Verified = 'verified';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::NotSubmitted => 'Not submitted',
            self::Pending => 'Waiting for review',
            self::Verified => 'Verified',
            self::Rejected => 'Rejected',
        };
    }
}
