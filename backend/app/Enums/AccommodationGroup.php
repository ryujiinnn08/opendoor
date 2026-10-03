<?php

namespace App\Enums;

/**
 * The reasonable-accommodation groups described in RA 7277.
 * Stored as plain text in accommodations.group_name so administrators can add new groups;
 * this enum supplies the seeded groups and their display order.
 */
enum AccommodationGroup: string
{
    case PhysicalAccess = 'Physical access';
    case Communication = 'Communication';
    case WorkArrangement = 'Work arrangement';
    case AssistiveTechnology = 'Assistive technology';
    case Support = 'Support';

    /**
     * Position of a group name in listings; unknown (admin-added) groups sort last.
     */
    public static function sortOrder(string $groupName): int
    {
        $index = array_search($groupName, array_column(self::cases(), 'value'), true);

        return $index === false ? count(self::cases()) : $index;
    }
}
