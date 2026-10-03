<?php

namespace App\Enums;

enum Role: string
{
    case Candidate = 'candidate';
    case Employer = 'employer';
    case Admin = 'admin';

    /**
     * Roles a visitor may choose on the registration page.
     * Administrators are created only by the seeder or another administrator.
     *
     * @return list<string>
     */
    public static function selfRegistrable(): array
    {
        return [self::Candidate->value, self::Employer->value];
    }

    public function label(): string
    {
        return match ($this) {
            self::Candidate => 'Job seeker',
            self::Employer => 'Employer',
            self::Admin => 'Administrator',
        };
    }
}
