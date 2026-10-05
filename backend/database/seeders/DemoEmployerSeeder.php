<?php

namespace Database\Seeders;

use App\Enums\EmployerType;
use App\Enums\MemberRole;
use App\Enums\RegistrationType;
use App\Enums\VerificationStatus;
use App\Models\Employer;
use App\Models\EmployerMember;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Gives the demo accounts their employer profiles (plan PHASE_2 decision 23):
 * a verified demo company with two departments and an HR officer, and an individual employer.
 *
 * Runs only for demo accounts that exist and have no employer profile yet, so it never
 * changes anything a person set up themselves.
 */
class DemoEmployerSeeder extends Seeder
{
    public const COMPANY_NAME = 'OpenDoor Demo Corp.';

    public function run(): void
    {
        $owner = User::firstWhere('email', UserSeeder::DEMO_EMPLOYER_EMAIL);
        if ($owner && ! $owner->membership) {
            $this->createDemoCompany($owner);
            $this->command?->line('  Demo company created: '.self::COMPANY_NAME);
        }

        $company = $owner?->fresh()->membership?->employer;
        $hr = User::firstWhere('email', UserSeeder::DEMO_HR_EMAIL);
        if ($hr && ! $hr->membership && $company?->isCompany()) {
            $department = $company->departments()->firstWhere('name', 'Human Resources') ?? $company->departments()->first();
            EmployerMember::create([
                'user_id' => $hr->id,
                'employer_id' => $company->id,
                'department_id' => $department->id,
                'role' => MemberRole::Hr,
            ]);
            $this->command?->line("  Demo HR officer added to {$department->name}");
        }

        $individual = User::firstWhere('email', UserSeeder::DEMO_INDIVIDUAL_EMAIL);
        if ($individual && ! $individual->membership) {
            $employer = Employer::create([
                'type' => EmployerType::Individual,
                'name' => $individual->name,
                'address' => 'Quezon City',
                'description' => 'Hiring a part-time home-based bookkeeper for a small family business.',
            ]);
            EmployerMember::create(['user_id' => $individual->id, 'employer_id' => $employer->id, 'role' => MemberRole::Owner]);
            $this->command?->line('  Demo individual employer created');
        }
    }

    private function createDemoCompany(User $owner): void
    {
        $company = Employer::create([
            'type' => EmployerType::Company,
            'name' => self::COMPANY_NAME,
            'industry' => 'Information Technology',
            'address' => 'Ayala Avenue, Makati City, Metro Manila',
            'description' => 'A sample company used to demonstrate OpenDoor. It is not a real business.',
        ]);

        $company->forceFill([
            'registration_type' => RegistrationType::Sec,
            'business_reg_no' => 'DEMO-2026-0001',
            'verification_status' => VerificationStatus::Verified,
            'verification_submitted_at' => now(),
            'verified_at' => now(),
        ])->save();

        $company->departments()->create(['name' => 'Human Resources', 'member_limit' => 3]);
        $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);

        EmployerMember::create(['user_id' => $owner->id, 'employer_id' => $company->id, 'role' => MemberRole::Owner]);
    }
}
