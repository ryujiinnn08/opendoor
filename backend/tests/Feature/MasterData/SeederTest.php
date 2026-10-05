<?php

namespace Tests\Feature\MasterData;

use App\Enums\Role;
use App\Models\Accommodation;
use App\Models\Category;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeding_twice_creates_no_duplicates(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(10, Category::count());
        $this->assertSame(18, Accommodation::count());
        $this->assertSame(5, User::count());
    }

    public function test_local_defaults_create_admin_and_demo_accounts(): void
    {
        $this->seed(UserSeeder::class);

        $admin = User::firstWhere('email', UserSeeder::LOCAL_ADMIN_EMAIL);
        $this->assertSame(Role::Admin, $admin->role);
        $this->assertTrue(Hash::check(UserSeeder::LOCAL_ADMIN_PASSWORD, $admin->password));
        $this->assertTrue(Hash::check(UserSeeder::LOCAL_DEMO_PASSWORD, User::firstWhere('email', UserSeeder::DEMO_CANDIDATE_EMAIL)->password));
        $this->assertSame(Role::Candidate, User::firstWhere('email', UserSeeder::DEMO_CANDIDATE_EMAIL)->role);
        $this->assertSame(Role::Employer, User::firstWhere('email', UserSeeder::DEMO_EMPLOYER_EMAIL)->role);
    }

    public function test_reseeding_never_resets_an_existing_password(): void
    {
        $this->seed(UserSeeder::class);
        $admin = User::firstWhere('email', UserSeeder::LOCAL_ADMIN_EMAIL);
        $admin->update(['password' => 'Changed@2026']);

        $this->seed(UserSeeder::class);

        $this->assertTrue(Hash::check('Changed@2026', $admin->fresh()->password));
    }

    public function test_production_refuses_to_seed_without_admin_settings(): void
    {
        $this->app['env'] = 'production';
        config(['opendoor.seed.admin_email' => null, 'opendoor.seed.admin_password' => null]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD');

        $this->runUserSeeder();
    }

    public function test_production_skips_demo_accounts_unless_a_demo_password_is_set(): void
    {
        $this->app['env'] = 'production';
        config([
            'opendoor.seed.admin_email' => 'admin@opendoor.example',
            'opendoor.seed.admin_password' => 'Strong@Admin1',
            'opendoor.seed.demo_password' => null,
        ]);

        $this->runUserSeeder();

        $this->assertSame(1, User::count());
        $this->assertSame(Role::Admin, User::first()->role);

        config(['opendoor.seed.demo_password' => 'Strong@Demo1']);
        $this->runUserSeeder();

        $this->assertSame(5, User::count());
    }

    /**
     * Run the seeder directly; `db:seed` would stop to ask for confirmation in production.
     */
    private function runUserSeeder(): void
    {
        $this->app->make(UserSeeder::class)->run();
    }
}
