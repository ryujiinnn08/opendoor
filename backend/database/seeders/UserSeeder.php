<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Creates the administrator and the demo accounts (plan PHASE_1 §3.1, PHASE_2 decision 23).
 *
 * Existing accounts are never changed, so re-seeding never resets a password.
 */
class UserSeeder extends Seeder
{
    public const LOCAL_ADMIN_EMAIL = 'admin@opendoor.test';

    public const LOCAL_ADMIN_PASSWORD = 'Admin_1234';

    public const LOCAL_DEMO_PASSWORD = 'Demo_1234';

    public const DEMO_CANDIDATE_EMAIL = 'candidate@opendoor.test';

    /** Owner of the demo company. */
    public const DEMO_EMPLOYER_EMAIL = 'employer@opendoor.test';

    /** HR officer in the demo company's Human Resources department. */
    public const DEMO_HR_EMAIL = 'hr@opendoor.test';

    public const DEMO_INDIVIDUAL_EMAIL = 'individual@opendoor.test';

    public function run(): void
    {
        $production = app()->isProduction();

        $adminEmail = config('opendoor.seed.admin_email') ?: ($production ? null : self::LOCAL_ADMIN_EMAIL);
        $adminPassword = config('opendoor.seed.admin_password') ?: ($production ? null : self::LOCAL_ADMIN_PASSWORD);

        if (! $adminEmail || ! $adminPassword) {
            throw new RuntimeException('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding production.');
        }

        $this->createAccount($adminEmail, 'OpenDoor Admin', Role::Admin, $adminPassword);

        // Demo accounts are a backup for demonstrations; in production they are opt-in.
        $demoPassword = config('opendoor.seed.demo_password') ?: ($production ? null : self::LOCAL_DEMO_PASSWORD);

        if (! $demoPassword) {
            $this->command?->warn('Demo accounts skipped: SEED_DEMO_PASSWORD is not set.');

            return;
        }

        $this->createAccount(self::DEMO_CANDIDATE_EMAIL, 'Demo Candidate', Role::Candidate, $demoPassword);
        $this->createAccount(self::DEMO_EMPLOYER_EMAIL, 'Demo Employer', Role::Employer, $demoPassword);
        $this->createAccount(self::DEMO_HR_EMAIL, 'Demo HR Officer', Role::Employer, $demoPassword);
        $this->createAccount(self::DEMO_INDIVIDUAL_EMAIL, 'Demo Individual', Role::Employer, $demoPassword);
    }

    private function createAccount(string $email, string $name, Role $role, string $password): void
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'role' => $role, 'password' => $password, 'consented_at' => now()],
        );

        $this->command?->line(sprintf(
            '  %s account %s: %s',
            $role->label(),
            $user->wasRecentlyCreated ? 'created' : 'already exists',
            $email,
        ));
    }
}
