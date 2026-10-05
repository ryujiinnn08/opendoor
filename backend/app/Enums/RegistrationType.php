<?php

namespace App\Enums;

/**
 * Philippine agencies that register businesses: DTI (sole proprietorships),
 * SEC (corporations and partnerships) and CDA (cooperatives).
 */
enum RegistrationType: string
{
    case Dti = 'dti';
    case Sec = 'sec';
    case Cda = 'cda';

    public function label(): string
    {
        return match ($this) {
            self::Dti => 'DTI (Department of Trade and Industry)',
            self::Sec => 'SEC (Securities and Exchange Commission)',
            self::Cda => 'CDA (Cooperative Development Authority)',
        };
    }
}
