<?php

namespace App\Enums;

enum MemberRole: string
{
    case Owner = 'owner';
    case Hr = 'hr';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Hr => 'HR officer',
        };
    }
}
