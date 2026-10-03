<?php

namespace Database\Seeders;

use App\Enums\AccommodationGroup;
use App\Models\Accommodation;
use Illuminate\Database\Seeder;

/**
 * Initial accommodation types from the proposal (Section VI-D), grouped by the
 * forms of reasonable accommodation in RA 7277.
 */
class AccommodationSeeder extends Seeder
{
    public function run(): void
    {
        foreach (self::types() as $group => $types) {
            foreach ($types as $name => $description) {
                Accommodation::updateOrCreate(
                    ['name' => $name],
                    ['group_name' => $group, 'description' => $description],
                );
            }
        }
    }

    /**
     * @return array<string, array<string, string>>
     */
    public static function types(): array
    {
        return [
            AccommodationGroup::PhysicalAccess->value => [
                'Wheelchair-accessible entrance' => 'Step-free entry with a ramp or level access.',
                'Accessible restroom' => 'Restroom with enough space, grab bars and an accessible door.',
                'Elevator or ground-floor workspace' => 'The workspace can be reached without stairs.',
                'Accessible parking' => 'Reserved parking close to an accessible entrance.',
            ],
            AccommodationGroup::Communication->value => [
                'Sign language interpreter' => 'Filipino Sign Language interpreter for meetings and training.',
                'Written or captioned meetings' => 'Meetings have captions, transcripts or written summaries.',
                'Screen-reader-compatible work tools' => 'Work software and documents can be used with a screen reader.',
            ],
            AccommodationGroup::WorkArrangement->value => [
                'Remote work' => 'The job can be done fully from home.',
                'Hybrid work' => 'Some days at home, some days on site.',
                'Flexible hours' => 'Start and end times can be adjusted.',
                'Part-time schedule' => 'Fewer hours than a full-time schedule.',
                'Modified duties' => 'Job tasks can be adjusted to fit the employee.',
            ],
            AccommodationGroup::AssistiveTechnology->value => [
                'Screen reader software provided' => 'The employer provides screen reader software such as NVDA or JAWS.',
                'Adjustable workstation' => 'Desk and chair can be adjusted, including for wheelchair users.',
                'Assistive listening devices' => 'Devices that help employees who are hard of hearing.',
            ],
            AccommodationGroup::Support->value => [
                'Job coach or onboarding buddy' => 'A person who helps the employee learn the job and settle in.',
                'Service animal allowed' => 'Service animals are welcome in the workplace.',
                'Transportation assistance' => 'Help getting to work, such as a shuttle or transport allowance.',
            ],
        ];
    }
}
