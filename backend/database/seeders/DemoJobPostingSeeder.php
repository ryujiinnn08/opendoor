<?php

namespace Database\Seeders;

use App\Enums\EmploymentType;
use App\Enums\InterviewFormat;
use App\Enums\PostingStatus;
use App\Enums\WorkSetup;
use App\Models\Accommodation;
use App\Models\Category;
use App\Models\Department;
use App\Models\Employer;
use App\Models\JobPosting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

/**
 * The five demo postings (plan PHASE_2 decision 36): four in the demo company's departments
 * and one for the individual employer. They are added only to an employer that has no
 * postings at all (deleted ones count), so nothing a person created, changed or deleted is
 * ever touched.
 */
class DemoJobPostingSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::firstWhere('email', UserSeeder::DEMO_EMPLOYER_EMAIL);
        $company = $owner?->membership?->employer;

        if ($owner && $company?->isCompany() && $this->hasNoPostings($company)) {
            $this->postCompanyJobs($company, $owner);
            $this->command?->line('  Demo job postings created for '.$company->name);
        }

        $individual = User::firstWhere('email', UserSeeder::DEMO_INDIVIDUAL_EMAIL);
        $employer = $individual?->membership?->employer;

        if ($individual && $employer && ! $employer->isCompany() && $this->hasNoPostings($employer)) {
            $this->post($employer, null, $individual, PostingStatus::Open, [
                'title' => 'Part-time Home-based Bookkeeper',
                'description' => 'Record sales and expenses for a small family business and prepare a simple monthly report. You work from home on your own schedule.',
                'category' => 'Accounting & Finance',
                'location' => 'Quezon City',
                'work_setup' => WorkSetup::Remote,
                'employment_type' => EmploymentType::PartTime,
                'interview_format' => InterviewFormat::Online,
                'closes_in' => 40,
            ], [
                'Remote work' => null,
                'Part-time schedule' => 'About 20 hours a week; you choose the days.',
                'Flexible hours' => null,
            ]);
            $this->command?->line('  Demo job posting created for the individual employer');
        }
    }

    private function postCompanyJobs(Employer $company, User $owner): void
    {
        $hrOfficer = User::firstWhere('email', UserSeeder::DEMO_HR_EMAIL) ?? $owner;
        $humanResources = $company->departments()->firstWhere('name', 'Human Resources') ?? $company->departments()->first();
        $it = $company->departments()->firstWhere('name', 'IT') ?? $humanResources;

        $this->post($company, $humanResources, $hrOfficer, PostingStatus::Open, [
            'title' => 'HR Assistant',
            'description' => 'Keep employee records up to date, schedule interviews and prepare onboarding documents. You will be part of a small, supportive team at our Makati office.',
            'category' => 'Administrative & Clerical',
            'location' => 'Makati City, Metro Manila',
            'work_setup' => WorkSetup::OnSite,
            'employment_type' => EmploymentType::FullTime,
            'interview_format' => InterviewFormat::OnlineOrOnSite,
            'closes_in' => 45,
        ], [
            'Wheelchair-accessible entrance' => 'Ramp at the Ayala Avenue entrance.',
            'Accessible restroom' => null,
            'Flexible hours' => 'Start any time between 7 and 10 a.m.',
            'Job coach or onboarding buddy' => null,
        ]);

        $this->post($company, $humanResources, $hrOfficer, PostingStatus::Pending, [
            'title' => 'Recruitment Coordinator',
            'description' => 'Screen applications, arrange interviews with hiring managers and keep candidates updated. You will make sure every candidate can ask for the interview accommodations they need.',
            'category' => 'Administrative & Clerical',
            'location' => 'Makati City, Metro Manila',
            'work_setup' => WorkSetup::Hybrid,
            'employment_type' => EmploymentType::FullTime,
            'interview_format' => InterviewFormat::Online,
            'closes_in' => 60,
        ], [
            'Hybrid work' => 'Office days are Tuesday and Thursday.',
            'Written or captioned meetings' => null,
            'Screen-reader-compatible work tools' => null,
        ]);

        $this->post($company, $it, $owner, PostingStatus::Open, [
            'title' => 'Junior Web Developer',
            'description' => 'Build and maintain accessible web pages for our clients using HTML, CSS and JavaScript. A senior developer reviews your work with you every week.',
            'category' => 'Information Technology',
            'location' => 'Anywhere in the Philippines',
            'work_setup' => WorkSetup::Remote,
            'employment_type' => EmploymentType::FullTime,
            'interview_format' => InterviewFormat::Online,
            'closes_in' => 30,
        ], [
            'Remote work' => 'Laptop and internet allowance provided.',
            'Flexible hours' => null,
            'Screen reader software provided' => 'NVDA is installed on the company laptop.',
            'Written or captioned meetings' => null,
        ]);

        // A draft saved before it was finished: no types, closing date or accommodations yet.
        $this->post($company, $it, $owner, PostingStatus::Draft, [
            'title' => 'IT Support Specialist',
            'description' => 'Set up laptops, help colleagues with software and printer problems, and keep the office network running. Most requests come through our help desk chat.',
            'category' => 'Information Technology',
            'location' => 'Makati City, Metro Manila',
            'work_setup' => WorkSetup::OnSite,
        ], []);
    }

    /**
     * @param  array<string, mixed>  $fields  Posting fields, plus `category` (a name) and `closes_in` (days).
     * @param  array<string, ?string>  $accommodations  Accommodation name => note.
     */
    private function post(Employer $employer, ?Department $department, User $author, PostingStatus $status, array $fields, array $accommodations): void
    {
        $posting = new JobPosting;
        $posting->fill([
            ...collect($fields)->except(['category', 'closes_in'])->all(),
            'category_id' => Category::firstWhere('name', $fields['category'])?->id,
            'closes_on' => isset($fields['closes_in'])
                ? CarbonImmutable::parse(JobPosting::today())->addDays($fields['closes_in'])->toDateString()
                : null,
        ])->forceFill([
            'employer_id' => $employer->id,
            'department_id' => $department?->id,
            'created_by' => $author->id,
            'status' => $status,
            'submitted_at' => $status === PostingStatus::Draft ? null : now(),
            'approved_at' => $status === PostingStatus::Open ? now() : null,
        ])->save();

        $ids = Accommodation::whereIn('name', array_keys($accommodations))->pluck('id', 'name');
        $posting->accommodations()->sync(
            collect($accommodations)
                ->filter(fn ($note, $name) => $ids->has($name))
                ->mapWithKeys(fn ($note, $name) => [$ids[$name] => ['note' => $note]])
                ->all(),
        );
    }

    private function hasNoPostings(Employer $employer): bool
    {
        return ! JobPosting::withTrashed()->where('employer_id', $employer->id)->exists();
    }
}
