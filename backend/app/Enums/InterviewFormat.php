<?php

namespace App\Enums;

enum InterviewFormat: string
{
    case Online = 'online';
    case OnSite = 'on_site';
    case OnlineOrOnSite = 'online_or_on_site';

    public function label(): string
    {
        return match ($this) {
            self::Online => 'Online',
            self::OnSite => 'On-site',
            self::OnlineOrOnSite => 'Online or on-site',
        };
    }
}
