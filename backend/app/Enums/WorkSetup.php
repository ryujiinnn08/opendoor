<?php

namespace App\Enums;

enum WorkSetup: string
{
    case OnSite = 'on_site';
    case Hybrid = 'hybrid';
    case Remote = 'remote';

    public function label(): string
    {
        return match ($this) {
            self::OnSite => 'On-site',
            self::Hybrid => 'Hybrid',
            self::Remote => 'Remote',
        };
    }
}
