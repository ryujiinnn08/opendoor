<?php

namespace App\Enums;

enum EmployerType: string
{
    case Company = 'company';
    case Individual = 'individual';

    public function label(): string
    {
        return match ($this) {
            self::Company => 'Company',
            self::Individual => 'Individual employer',
        };
    }
}
