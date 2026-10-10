# Phase 2B: Job Postings and Approvals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Owners, HR officers and individual employers create, save, submit, edit, close, reopen, re-date and delete job postings with structured accommodations; admins approve or reject them; the UI gets the §4.10 polish; everything is checked by Superpowers and GSD reviews before the frontend commit.

**Architecture:** Laravel stores postings in `job_postings` plus a `job_posting_accommodation` pivot (with a note). The `PostingStatus` enum owns the stored status transitions; a `JobPostingWorkflow` service owns saving, status actions and the per-posting `actions` list; `JobPostingPolicy` enforces company and department scope. "Closed automatically" is computed on read from `closes_on` in Manila time, so no scheduler is needed. React gets shared posting building blocks (status badge, accommodation picker, job details, closing-date dialog) used by the employer list, form and preview pages and the admin approvals and review pages; buttons come from the server's `actions` list.

**Tech Stack:** Laravel 12 on a PHP 8.2 platform, Sanctum SPA cookies, MySQL 8 / XAMPP MariaDB 10.4 (SQLite in tests); React 19, React Router 7, Tailwind CSS 4, Radix Dialog, Vitest + Testing Library + vitest-axe, oxlint.

**Spec:** `docs/PHASE_2_PLAN.md`: §1 (Phase 2B), §2 demo B1–B7, §3.1 decisions 4–7, 10, 11, 20, 22; §3.3 decisions 24–38; §4.2; §4.4; §4.6–§4.10; §5 steps 6–9; Appendix A (Phase 2B) and B.

**Base commit:** `e78e4aa` (the reviews in Task 15 diff against it).

## Global Constraints

- PHP must run on 8.2: no typed class constants, no `#[\Override]`, no `json_validate()`.
- Migrations: "required date columns use `dateTime()` (not `timestamp()`)"; nullable timestamps are fine (README, MariaDB 10.4).
- Closing date: "between tomorrow and 6 months ahead", in Philippine time (`Asia/Manila`); "the posting stays open until the end of that day".
- Employment type: Full-time, Part-time, Contract, Internship. Work setup: On-site, Hybrid, Remote. Interview format: Online, On-site, Online or on-site.
- Status labels: Draft, Waiting for approval, Open, Rejected, Closed. Filter labels: All · Open · Waiting · Drafts · Rejected · Closed.
- Limits: title 150, location 150, description 5,000, accommodation note 255 characters; rejection reason 500 (existing `DecisionRequest`).
- "Every rule is checked by the server (Laravel Policies). Hiding a button in React is only for convenience."
- Every status is an icon plus text, never color alone; visible labels; targets at least 44 px (`min-h-11`); keyboard-only works; no sideways scrolling at 360 px; focus moves sensibly after dialogs; results announced with `useAnnounce()`.
- Copy: plain language, sentence case, active voice; a button says what happens; errors say what to fix.
- §4.10: approved tokens only; amber (`accent`) only for accommodation promises; Atkinson Hyperlegible only; no all-caps labels, gradients, decorative shadows or dot-separated detail lines; one motion (the note field reveal), off under reduced motion.
- Seeders never change existing data.
- Exactly two commits on `main`: backend (Task 7) and frontend (Task 16), each ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Manila midnight versus UTC midnight.** From 00:00 to 08:00 Manila time the UTC date is a day behind. A posting that closed yesterday (Manila) must already show Closed, and "tomorrow" must be Manila's tomorrow on the server and in the date picker. Tests: Task 2, Task 9.
2. **Month-end date maths.** Six months after August 31 is February 28, not March 3. Server and date picker must agree, or the picker offers dates the server refuses. Tests: Task 2, Task 9.
3. **A crafted `department_id`.** An HR officer sending another department's id gets their own department; an owner sending another company's department is refused. Test: Task 3.
4. **Membership changes while a form is open.** An HR officer moved to another department gets a clear 403 message on save; a removed one gets the 409 setup message. Test: Task 4.
5. **Messy accommodation input.** The same accommodation twice, a retired one newly ticked, a note of only spaces: refused with a named message, or stored as no note. Tests: Task 3.

## Threat model (verified by the security review in Task 15)

| Threat | Mitigation | Task |
|---|---|---|
| HR officer opens or changes another department's posting by editing the id in the address | `JobPostingPolicy::manage` on every employer posting route | 3, 4, 5 |
| Company A reaches company B's posting | Policy compares `employer_id` | 3, 4, 5 |
| Mass assignment of `status`, `employer_id`, `department_id`, `created_by`, `approved_at` | Not in `$fillable`; the workflow sets them with `forceFill` | 2, 3 |
| Employer approves their own posting | Approval routes only under `role:admin` | 6 |
| Drafts shown to admins | Admin `show` answers 404 for drafts; the queue never lists them | 6 |
| Deleted postings still reachable | SoftDeletes + implicit route binding → 404 | 4 |
| Script injection through description or notes | React escapes text; no `dangerouslySetInnerHTML`; description shown with `whitespace-pre-line` | 9 |
| Retired accommodation added with a hand-made request | `JobPostingRequest::after()` check | 3 |

## File map

**Backend (`backend/`)**

| File | Responsibility |
|---|---|
| `app/Enums/PostingStatus.php`, `EmploymentType.php`, `WorkSetup.php`, `InterviewFormat.php` | Values, labels, stored transitions |
| `config/opendoor.php` | `postings.timezone`, `postings.max_months_ahead` |
| `database/migrations/2026_10_05_200000_create_job_postings_table.php`, `…_200100_create_job_posting_accommodation_table.php` | Tables |
| `app/Models/JobPosting.php` | Relations, Manila "today", shown status, scopes |
| `app/Rules/ClosingDate.php` | Closing date range rule and message |
| `database/factories/JobPostingFactory.php` | Test data with status states |
| `app/Policies/JobPostingPolicy.php` | Company and department scope |
| `app/Services/JobPostingWorkflow.php` | Saving, status actions, actions list, approval |
| `app/Http/Requests/Employer/JobPostingRequest.php`, `PostingStatusRequest.php` | Validation |
| `app/Http/Resources/JobPostingResource.php` | JSON shape shared by employer and admin |
| `app/Http/Controllers/Employer/JobPostingController.php`, `JobPostingStatusController.php`, `DashboardController.php` | Employer endpoints |
| `app/Http/Controllers/Admin/JobPostingApprovalController.php` | Admin queue and decisions |
| `app/Http/Controllers/Admin/DashboardController.php`, `CategoryController.php`, `Employer/DepartmentController.php` | Count and delete guards (modified) |
| `database/seeders/DemoJobPostingSeeder.php`, `DatabaseSeeder.php` | Five demo postings |
| `routes/api.php` | Routes (modified) |
| `tests/Unit/PostingStatusTest.php`; `tests/Concerns/BuildsPostings.php`; `tests/Feature/Employer/JobPostingModelTest.php`, `JobPostingTest.php`, `JobPostingAccessTest.php`, `JobPostingStatusTest.php`; `tests/Feature/Admin/PostingApprovalTest.php` | New tests |
| `tests/Feature/Admin/CategoryManagementTest.php`, `tests/Feature/Employer/DepartmentTest.php`, `tests/Feature/MasterData/SeederTest.php` | Extended tests |

**Frontend (`frontend/src/`)**

| File | Responsibility |
|---|---|
| `index.css` | Type scale tokens, reveal animation |
| `components/ui/Icon.jsx` | Small inline SVG icon set |
| `components/ui/StatusBadge.jsx`, `PageHeading.jsx`, `DashboardTile.jsx`, `FilterTabs.jsx` | Shared polish (modified) |
| `components/ui/PageHeader.jsx` | Title, intro and main action |
| `lib/postingOptions.js`, `lib/format.js` | Option lists, filters, Manila date range, `formatDay` |
| `components/postings/PostingStatusBadge.jsx`, `AccommodationGroupIcon.jsx`, `AccommodationPicker.jsx`, `JobDetails.jsx`, `ClosingDateDialog.jsx` | Posting building blocks |
| `api/jobPostings.js`; `api/employer.js`, `api/admin.js` (modified) | API calls |
| `portals/employer/JobPostingsPage.jsx`, `postings/PostingListItem.jsx` | Employer list |
| `portals/employer/JobPostingFormPage.jsx`, `postings/postingForm.js` | Create and edit |
| `portals/employer/JobPostingPreviewPage.jsx` | Preview |
| `portals/admin/PostingApprovalsPage.jsx`, `PostingReviewPage.jsx` | Admin queue and review |
| `router.jsx`, `components/layout/portalMenus.js`, `PortalLayout.jsx`, `portals/employer/EmployerDashboard.jsx`, `portals/admin/AdminDashboard.jsx`, `portals/admin/CategoriesPage.jsx` | Wiring and dashboards (modified) |

---

### Task 1: Posting enums and settings

**Files:**
- Create: `backend/app/Enums/PostingStatus.php`, `EmploymentType.php`, `WorkSetup.php`, `InterviewFormat.php`
- Modify: `backend/config/opendoor.php` (new `postings` section)
- Test: `backend/tests/Unit/PostingStatusTest.php` (extends `PHPUnit\Framework\TestCase`, like `tests/Unit/ExampleTest.php`)

**Interfaces:**
- Produces:
  - `PostingStatus`: `Draft='draft'`, `Pending='pending'`, `Open='open'`, `Rejected='rejected'`, `Closed='closed'`; `label(): string`; `canTransitionTo(PostingStatus $next): bool`.
  - `EmploymentType`: `FullTime='full_time'`, `PartTime='part_time'`, `Contract='contract'`, `Internship='internship'`; `label()`.
  - `WorkSetup`: `OnSite='on_site'`, `Hybrid='hybrid'`, `Remote='remote'`; `label()`.
  - `InterviewFormat`: `Online='online'`, `OnSite='on_site'`, `OnlineOrOnSite='online_or_on_site'`; `label()`.
  - `config('opendoor.postings.timezone') === 'Asia/Manila'`, `config('opendoor.postings.max_months_ahead') === 6`.

- [ ] **Step 1: Write the failing test**

```php
public function test_allowed_stored_status_changes_follow_the_life_cycle(): void
{
    $allowed = [
        'draft' => ['pending'],
        'pending' => ['open', 'rejected'],
        'rejected' => ['pending'],
        'open' => ['pending', 'closed'],
        'closed' => ['open', 'pending'],
    ];

    foreach (PostingStatus::cases() as $from) {
        foreach (PostingStatus::cases() as $to) {
            $this->assertSame(
                in_array($to->value, $allowed[$from->value], true),
                $from->canTransitionTo($to),
                "{$from->value} to {$to->value}",
            );
        }
    }
}

public function test_labels_use_plain_language(): void
{
    $this->assertSame('Waiting for approval', PostingStatus::Pending->label());
    $this->assertSame('Full-time', EmploymentType::FullTime->label());
    $this->assertSame('On-site', WorkSetup::OnSite->label());
    $this->assertSame('Online or on-site', InterviewFormat::OnlineOrOnSite->label());
}
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd backend && php artisan test --filter=PostingStatusTest`
Expected: FAIL, `Class "App\Enums\PostingStatus" not found`.

- [ ] **Step 3: Create the four enums** in the style of `app/Enums/VerificationStatus.php` (string-backed, `label()` with `match`), and add to `config/opendoor.php`:

```php
'postings' => [
    // Closing dates are whole days in Philippine time (plan PHASE_2 decision 29).
    'timezone' => 'Asia/Manila',
    'max_months_ahead' => 6,
],
```

- [ ] **Step 4: Run it and see it pass**

Run: `cd backend && php artisan test --filter=PostingStatusTest`
Expected: PASS (2 tests).

---

### Task 2: Tables, model, factory and the closing date rule

**Files:**
- Create: `backend/database/migrations/2026_10_05_200000_create_job_postings_table.php`, `backend/database/migrations/2026_10_05_200100_create_job_posting_accommodation_table.php`, `backend/app/Models/JobPosting.php`, `backend/app/Rules/ClosingDate.php`, `backend/database/factories/JobPostingFactory.php`
- Test: `backend/tests/Feature/Employer/JobPostingModelTest.php` (uses `BuildsTeams`, `RefreshDatabase`)

**Interfaces:**
- Consumes: Task 1 enums and config.
- Produces:
  - Table `job_postings`: `id`; `employer_id` (FK, cascade on delete); `department_id` (nullable FK, **restrict** on delete); `created_by` (nullable FK users, null on delete); `category_id` (nullable FK, **restrict**); `title` string(150); `description` text nullable; `location` string(150) nullable; `employment_type`, `work_setup`, `interview_format` string(20) nullable; `closes_on` date nullable; `status` string(20) default `'draft'`; `rejection_reason` text nullable; `submitted_at`, `approved_at` timestamp nullable; `timestamps()`; `softDeletes()`; indexes `[employer_id, status]`, `[status, submitted_at]`.
  - Table `job_posting_accommodation`: `job_posting_id` (FK cascade), `accommodation_id` (FK restrict), `note` string(255) nullable, primary key `[job_posting_id, accommodation_id]`.
  - `JobPosting` (`HasFactory`, `SoftDeletes`): `$fillable = ['title', 'description', 'location', 'employment_type', 'work_setup', 'interview_format', 'closes_on', 'category_id']`; `$attributes = ['status' => 'draft']`; casts for the four enums, `closes_on => 'date'`, `submitted_at`/`approved_at => 'datetime'`.
  - Relations: `employer()`, `department()`, `category()`, `creator()` (`created_by`), `accommodations(): BelongsToMany` on `job_posting_accommodation` `->withPivot('note')`.
  - `static today(): string` (Y-m-d in `opendoor.postings.timezone`); `isExpired(): bool` (stored Open and `closes_on` before today); `displayStatus(): PostingStatus` (Closed when expired, else stored).
  - Scopes: `inDisplayStatus(PostingStatus $status)` (Open = stored open and `closes_on` null or ≥ today; Closed = stored closed, or stored open and `closes_on` < today; others = stored); `visibleTo(User $user)` (the member's employer; HR officers only their department).
  - `ClosingDate implements ValidationRule`: `static earliest(): CarbonImmutable` (today + 1 day), `static latest(): CarbonImmutable` (today `addMonthsNoOverflow(6)`), `static message(): string` = `"Choose a closing date between {earliest} and {latest}."` with dates formatted `F j, Y`. Values must be real `Y-m-d` dates (strict: `2026-02-30` fails).
  - Factory: complete fields (category from `Category::factory()`, `employer_id` from `Employer::factory()`, `closes_on` = today + 30 days), status draft. States: `in(Department|Employer $place)`, `pending()`, `open()`, `rejected(string $reason = 'Describe the duties in more detail.')`, `closed()`, `expired()` (open, `closes_on` yesterday). `pending`/`open`/`closed` set `submitted_at`; `open`/`closed` set `approved_at`.

- [ ] **Step 1: Write the failing tests**

```php
public function test_an_open_posting_closes_at_the_end_of_its_closing_day_in_manila(): void
{
    $this->travelTo(CarbonImmutable::parse('2026-10-05 15:59:00')); // 23:59 in Manila
    $posting = JobPosting::factory()->open()->create(['closes_on' => '2026-10-05']);
    $this->assertSame(PostingStatus::Open, $posting->displayStatus());

    $this->travelTo(CarbonImmutable::parse('2026-10-05 16:30:00')); // 00:30 on October 6 in Manila
    $this->assertTrue($posting->fresh()->isExpired());
    $this->assertSame(PostingStatus::Closed, $posting->fresh()->displayStatus());
}

public function test_filters_count_expired_postings_as_closed(): void
{
    $open = JobPosting::factory()->open()->create();
    $expired = JobPosting::factory()->expired()->create();
    $closed = JobPosting::factory()->closed()->create();

    $this->assertEqualsCanonicalizing([$open->id], JobPosting::inDisplayStatus(PostingStatus::Open)->pluck('id')->all());
    $this->assertEqualsCanonicalizing([$expired->id, $closed->id], JobPosting::inDisplayStatus(PostingStatus::Closed)->pluck('id')->all());
}

public function test_the_closing_date_range_uses_manila_dates(): void
{
    $this->travelTo(CarbonImmutable::parse('2026-10-05 16:30:00')); // October 6 in Manila
    $this->assertSame('2026-10-07', ClosingDate::earliest()->toDateString());
    $this->assertSame('2027-04-06', ClosingDate::latest()->toDateString());
    $this->assertSame('Choose a closing date between October 7, 2026 and April 6, 2027.', ClosingDate::message());
}

public function test_six_months_after_august_31_is_february_28(): void
{
    $this->travelTo(CarbonImmutable::parse('2026-08-31 02:00:00'));
    $this->assertSame('2027-02-28', ClosingDate::latest()->toDateString());
}

public function test_the_rule_refuses_dates_outside_the_range_and_bad_dates(): void
{
    $this->travelTo(CarbonImmutable::parse('2026-10-05 02:00:00'));
    $passes = fn ($value) => Validator::make(['closes_on' => $value], ['closes_on' => [new ClosingDate]])->passes();

    $this->assertFalse($passes('2026-10-05'));
    $this->assertTrue($passes('2026-10-06'));
    $this->assertTrue($passes('2027-04-05'));
    $this->assertFalse($passes('2027-04-06'));
    $this->assertFalse($passes('06/10/2026'));
    $this->assertFalse($passes('2026-02-30'));
}

public function test_hr_officers_see_only_their_departments_postings(): void
{
    [$owner, $company, $general] = $this->companyWithOwner();
    $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
    $hr = $this->hrOfficerIn($general);
    $mine = JobPosting::factory()->in($general)->create();
    $theirs = JobPosting::factory()->in($it)->create();
    JobPosting::factory()->create(); // another company

    $this->assertEqualsCanonicalizing([$mine->id, $theirs->id], JobPosting::visibleTo($owner)->pluck('id')->all());
    $this->assertSame([$mine->id], JobPosting::visibleTo($hr)->pluck('id')->all());
}
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd backend && php artisan test --filter=JobPostingModelTest`
Expected: FAIL, `Class "App\Models\JobPosting" not found`.

- [ ] **Step 3: Write the two migrations, the model, the rule and the factory** to the interfaces above. Comment the restrict foreign keys ("keeps a department or category from being deleted while any posting, even a deleted one, uses it", decision 32).

- [ ] **Step 4: Run them and see them pass**

Run: `cd backend && php artisan test --filter=JobPostingModelTest`
Expected: PASS (6 tests).

---

### Task 3: Create and save postings

**Files:**
- Create: `backend/app/Policies/JobPostingPolicy.php`, `backend/app/Services/JobPostingWorkflow.php`, `backend/app/Http/Requests/Employer/JobPostingRequest.php`, `backend/app/Http/Resources/JobPostingResource.php`, `backend/app/Http/Controllers/Employer/JobPostingController.php` (`store`, `show`, `update`), `backend/tests/Concerns/BuildsPostings.php`
- Modify: `backend/routes/api.php` (inside the `employer.profile` group: `POST job-postings`, `GET job-postings/{posting}`, `PUT job-postings/{posting}`)
- Test: `backend/tests/Feature/Employer/JobPostingTest.php` (uses `BuildsTeams`, `BuildsPostings`, `RefreshDatabase`)

**Interfaces:**
- Consumes: Task 2 model, rule, factory; `User::membership`, `EmployerMember::isOwner()`, `Employer::isCompany()`.
- Produces:
  - `JobPostingPolicy::manage(User $user, JobPosting $posting): Response`. Denials: `'This job posting belongs to another employer.'` (different `employer_id`, or no membership) and `'You can only manage job postings in your own department.'` (HR officer, other department). Owners (company or individual) are allowed for their employer.
  - `JobPostingWorkflow`:
    - `create(User $author, array $fields, array $accommodations, bool $submit): JobPosting`
    - `update(JobPosting $posting, User $editor, array $fields, array $accommodations, bool $submit): JobPosting`
    - `actionsFor(JobPosting $posting): array` (subset of `['edit', 'close', 'change_closing_date', 'reopen', 'delete']` in that order: shown Open gets edit, close, change_closing_date, delete; shown Closed gets edit, reopen, delete; every other status gets edit, delete)
    - `$fields` are the validated scalar fields; `$accommodations` is `list<array{id: int, note: ?string}>`, synced to the pivot with notes.
    - Department: individual employer → `null`; HR officer → their own `department_id` (whatever was sent); company owner → the validated `department_id`. Set with `forceFill`, as are `employer_id`, `created_by` (on create only) and `status`.
    - Status after saving:

      | Stored before | `submit` false | `submit` true |
      |---|---|---|
      | *(new)* | Draft | Pending |
      | Draft | Draft | Pending |
      | Rejected | Rejected | Pending |
      | Pending | Pending (keeps `submitted_at`) | same |
      | Open or Closed (including expired) | Pending | same |

      Entering Pending from another status sets `submitted_at = now()` and clears `rejection_reason`. `approved_at` is never cleared.
  - `JobPostingRequest`: `authorize()` returns `Gate::inspect('manage', $posting)` when a posting is bound (403 before validation), else `true`; `submitting(): bool` (true when `submit` is true or the bound posting is stored Pending, Open or Closed); `postingFields(): array`; `accommodationList(): array`.
  - Rules (draft → submitting): `title` required, max 150 (always); `department_id` required and `exists` in the user's company (company owners only, drafts too; ignored for others); `category_id` nullable → required, `exists:categories,id`; `description` nullable → required, max 5000; `location` nullable → required, max 150; `employment_type`, `work_setup`, `interview_format` nullable → required, `Rule::enum`; `closes_on` nullable `date_format:Y-m-d` → required + `new ClosingDate`; `accommodations` array → required, min 1; `accommodations.*.id` required, integer, `distinct`, exists; `accommodations.*.note` nullable, max 255. `after()`: an inactive accommodation not already attached to the bound posting fails on `accommodations.{i}.id`.
  - Messages (exact):

    | Key | Message |
    |---|---|
    | `title.required` / `title.max` | Enter a job title. / Use 150 characters or fewer. |
    | `department_id.required` / `.exists` | Choose the department this job is in. / Choose one of your company's departments. |
    | `category_id.required` / `.exists` | Choose a category. / Choose a category from the list. |
    | `description.required` / `.max` | Describe the job. / Use 5,000 characters or fewer. |
    | `location.required` / `.max` | Enter where the job is, e.g., "Makati City" or "Anywhere in the Philippines". / Use 150 characters or fewer. |
    | `employment_type.*` | Choose the employment type. |
    | `work_setup.*` | Choose the work setup. |
    | `interview_format.*` | Choose how interviews are held. |
    | `closes_on.required` / `.date_format` / range | Choose a closing date. / Enter the closing date as a full date. / `ClosingDate::message()` |
    | `accommodations.required` / `.min` | Choose at least one accommodation your workplace provides. |
    | `accommodations.*.id.distinct` / `.exists` | Each accommodation can be chosen only once. / Choose accommodations from the list. |
    | retired, newly added | "{name}" is no longer offered. Untick it to continue. |
    | `accommodations.*.note.max` | Use 255 characters or fewer for each note. |

  - `JobPostingResource::RELATIONS = ['employer', 'department', 'category', 'creator', 'accommodations']`. JSON keys: `id, title, description, location, employment_type, work_setup, interview_format, closes_on` (Y-m-d or null), `status` (the **shown** status value), `closed_automatically` (bool), `rejection_reason` (rejected only, else null), `changed_after_approval` (stored Pending with `approved_at` set), `submitted_at, approved_at, updated_at` (ISO 8601 or null), `category {id, name}|null`, `department {id, name}|null`, `employer {id, type, name, logo_url, is_verified, verification_status}`, `created_by {name}|null`, `accommodations [{id, name, group_name, note, is_active}]` sorted by `AccommodationGroup::sortOrder()` then name, and `actions` **only when the viewer is an employer**.
  - Routes: `POST /api/employer/job-postings` → 201; `GET`, `PUT /api/employer/job-postings/{posting}` (controller parameter `JobPosting $posting`); `show` calls `Gate::authorize('manage', $posting)`; `update` relies on the request's `authorize()`.
  - `BuildsPostings::completePosting(array $overrides = []): array`: creates a category and two active accommodations; returns every field filled (`title` 'Junior Web Developer', `location` 'Anywhere in the Philippines', `employment_type` 'full_time', `work_setup` 'remote', `interview_format` 'online', `closes_on` = `ClosingDate::earliest()->addDays(29)`, both accommodations with `note` null) plus `'submit' => true`.

- [ ] **Step 1: Write the failing tests**

```php
public function test_a_draft_saves_with_just_a_title(): void
{
    [, , $general] = $this->companyWithOwner();
    $hr = $this->hrOfficerIn($general);

    $this->actingAs($hr, 'web')->postJson('/api/employer/job-postings', ['title' => 'Data encoder'])
        ->assertCreated()
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.department.id', $general->id)
        ->assertJsonPath('data.actions', ['edit', 'delete']);
}

public function test_submitting_needs_every_field_and_an_accommodation(): void
{
    [, , $general] = $this->companyWithOwner();

    $this->actingAs($this->hrOfficerIn($general), 'web')
        ->postJson('/api/employer/job-postings', ['title' => 'Data encoder', 'submit' => true])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['category_id', 'description', 'location', 'employment_type', 'work_setup', 'interview_format', 'closes_on'])
        ->assertJsonValidationErrors(['accommodations' => 'Choose at least one accommodation your workplace provides.']);
}

public function test_a_complete_posting_is_submitted_with_its_notes(): void
{
    [, , $general] = $this->companyWithOwner();
    $payload = $this->completePosting();
    $payload['accommodations'][0]['note'] = '  Ramp at the side entrance  ';
    $payload['accommodations'][1]['note'] = '   ';

    $response = $this->actingAs($this->hrOfficerIn($general), 'web')->postJson('/api/employer/job-postings', $payload)
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending');

    $this->assertNotNull($response->json('data.submitted_at'));
    $notes = collect($response->json('data.accommodations'))->pluck('note')->all();
    $this->assertEqualsCanonicalizing(['Ramp at the side entrance', null], $notes);
}

public function test_owners_choose_a_department_and_hr_officers_cannot(): void
{
    [$owner, $company, $general] = $this->companyWithOwner();
    $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
    [, , $otherCompanysDepartment] = $this->companyWithOwner();

    $this->actingAs($owner, 'web')->postJson('/api/employer/job-postings', ['title' => 'Analyst'])
        ->assertJsonValidationErrors(['department_id' => 'Choose the department this job is in.']);
    $this->postJson('/api/employer/job-postings', ['title' => 'Analyst', 'department_id' => $otherCompanysDepartment->id])
        ->assertJsonValidationErrors(['department_id' => "Choose one of your company's departments."]);
    $this->postJson('/api/employer/job-postings', ['title' => 'Analyst', 'department_id' => $it->id])
        ->assertCreated()->assertJsonPath('data.department.id', $it->id);

    $this->actingAs($this->hrOfficerIn($general), 'web')
        ->postJson('/api/employer/job-postings', ['title' => 'Clerk', 'department_id' => $it->id])
        ->assertCreated()->assertJsonPath('data.department.id', $general->id);
}

public function test_individual_employers_postings_have_no_department(): void
{
    [$individual] = $this->individualEmployer();

    $this->actingAs($individual, 'web')->postJson('/api/employer/job-postings', $this->completePosting(['department_id' => 99]))
        ->assertCreated()
        ->assertJsonPath('data.department', null)
        ->assertJsonPath('data.employer.type', 'individual');
}

public function test_retired_accommodations_cannot_be_added_but_may_stay(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $retired = Accommodation::factory()->retired()->create(['name' => 'Accessible parking']);
    $payload = $this->completePosting();
    $payload['accommodations'][] = ['id' => $retired->id, 'note' => null];

    $this->actingAs($individual, 'web')->postJson('/api/employer/job-postings', $payload)
        ->assertJsonValidationErrors(['accommodations.2.id' => '"Accessible parking" is no longer offered. Untick it to continue.']);

    $posting = JobPosting::factory()->in($employer)->create();
    $posting->accommodations()->attach($retired->id);
    $this->putJson("/api/employer/job-postings/{$posting->id}", array_merge($payload, ['submit' => false]))->assertOk();
}

public function test_the_same_accommodation_cannot_be_chosen_twice(): void
{
    [$individual] = $this->individualEmployer();
    $payload = $this->completePosting();
    $payload['accommodations'][1]['id'] = $payload['accommodations'][0]['id'];

    $this->actingAs($individual, 'web')->postJson('/api/employer/job-postings', $payload)
        ->assertJsonValidationErrors(['accommodations.1.id' => 'Each accommodation can be chosen only once.']);
}

/** @return array<string, array{0: string, 1: bool, 2: string}> */
public static function savingCases(): array
{
    return [
        'draft kept' => ['draft', false, 'draft'],
        'draft submitted' => ['draft', true, 'pending'],
        'rejected kept' => ['rejected', false, 'rejected'],
        'rejected resubmitted' => ['rejected', true, 'pending'],
        'waiting stays waiting' => ['pending', false, 'pending'],
        'open goes back to waiting' => ['open', false, 'pending'],
        'closed goes back to waiting' => ['closed', false, 'pending'],
        'expired goes back to waiting' => ['expired', false, 'pending'],
    ];
}

#[DataProvider('savingCases')]
public function test_saving_follows_the_life_cycle(string $state, bool $submit, string $expected): void
{
    [$individual, $employer] = $this->individualEmployer();
    $factory = JobPosting::factory()->in($employer);
    $posting = ($state === 'draft' ? $factory : $factory->{$state}())->create();
    $before = $posting->submitted_at;

    $this->actingAs($individual, 'web')
        ->putJson("/api/employer/job-postings/{$posting->id}", $this->completePosting(['submit' => $submit]))
        ->assertOk()
        ->assertJsonPath('data.status', $expected);

    if ($state === 'pending') {
        $this->assertEquals($before, $posting->fresh()->submitted_at); // keeps its place in the queue
    }
    if ($state === 'rejected' && $expected === 'pending') {
        $this->assertNull($posting->fresh()->rejection_reason);
    }
}

public function test_waiting_open_and_closed_postings_must_stay_complete(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $posting = JobPosting::factory()->in($employer)->pending()->create();

    $this->actingAs($individual, 'web')
        ->putJson("/api/employer/job-postings/{$posting->id}", $this->completePosting(['description' => '', 'submit' => false]))
        ->assertJsonValidationErrors(['description' => 'Describe the job.']);
}

public function test_each_posting_lists_the_actions_allowed(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $expected = [
        'pending' => ['edit', 'delete'],
        'rejected' => ['edit', 'delete'],
        'open' => ['edit', 'close', 'change_closing_date', 'delete'],
        'closed' => ['edit', 'reopen', 'delete'],
        'expired' => ['edit', 'reopen', 'delete'],
    ];
    $this->actingAs($individual, 'web');

    foreach ($expected as $state => $actions) {
        $posting = JobPosting::factory()->in($employer)->{$state}()->create();
        $this->getJson("/api/employer/job-postings/{$posting->id}")->assertJsonPath('data.actions', $actions);
    }
}

public function test_job_seekers_and_admins_cannot_use_employer_posting_routes(): void
{
    $this->actingAs(User::factory()->create(), 'web')->postJson('/api/employer/job-postings', ['title' => 'X'])->assertForbidden();
    $this->actingAs(User::factory()->admin()->create(), 'web')->postJson('/api/employer/job-postings', ['title' => 'X'])->assertForbidden();
}
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd backend && php artisan test --filter=JobPostingTest`
Expected: FAIL with 404s (routes don't exist yet).

- [ ] **Step 3: Write the policy, workflow (`create`, `update`, `actionsFor`), request, resource, controller methods, routes and the `BuildsPostings` trait** to the interfaces above. Wrap saves in `DB::transaction`.

- [ ] **Step 4: Run them and see them pass**

Run: `cd backend && php artisan test --filter=JobPostingTest`
Expected: PASS.

---

### Task 4: Listing, access, deleting and the employer dashboard

**Files:**
- Modify: `backend/app/Http/Controllers/Employer/JobPostingController.php` (`index`, `destroy`), `backend/routes/api.php`
- Create: `backend/app/Http/Controllers/Employer/DashboardController.php`
- Test: `backend/tests/Feature/Employer/JobPostingAccessTest.php` (uses `BuildsTeams`, `BuildsPostings`, `RefreshDatabase`)

**Interfaces:**
- Consumes: Task 3 policy, resource, `visibleTo`, `inDisplayStatus`.
- Produces:
  - `GET /api/employer/job-postings?status=all|open|pending|draft|rejected|closed&department={id}`: validated (`status` default `all`; other values → 422); newest `updated_at` first (then id); at most 200; `department` applies to company owners only.
  - `DELETE /api/employer/job-postings/{posting}` → 204 (soft delete; `Gate::authorize('manage', $posting)`).
  - `GET /api/employer/dashboard` → `{"data": {"postings": {"draft": n, "pending": n, "open": n, "rejected": n, "closed": n}}}` over `visibleTo($user)` using shown statuses.

- [ ] **Step 1: Write the failing tests**

```php
public function test_hr_officers_cannot_reach_another_departments_postings(): void
{
    [$owner, $company, $general] = $this->companyWithOwner();
    $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
    $posting = JobPosting::factory()->in($it)->pending()->create();
    $this->actingAs($this->hrOfficerIn($general), 'web');

    $message = 'You can only manage job postings in your own department.';
    $this->getJson("/api/employer/job-postings/{$posting->id}")->assertForbidden()->assertJsonPath('message', $message);
    $this->putJson("/api/employer/job-postings/{$posting->id}", $this->completePosting())->assertForbidden();
    $this->deleteJson("/api/employer/job-postings/{$posting->id}")->assertForbidden();

    $this->actingAs($owner, 'web')->getJson("/api/employer/job-postings/{$posting->id}")->assertOk();
}

public function test_other_companies_cannot_reach_a_posting(): void
{
    [, , $department] = $this->companyWithOwner();
    $posting = JobPosting::factory()->in($department)->create();
    [$otherOwner] = $this->companyWithOwner();

    $this->actingAs($otherOwner, 'web')->getJson("/api/employer/job-postings/{$posting->id}")
        ->assertForbidden()->assertJsonPath('message', 'This job posting belongs to another employer.');
    $this->deleteJson("/api/employer/job-postings/{$posting->id}")->assertForbidden();
}

public function test_lists_show_only_what_each_person_may_see(): void
{
    [$owner, $company, $general] = $this->companyWithOwner();
    $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
    $a = JobPosting::factory()->in($general)->create();
    $b = JobPosting::factory()->in($it)->create();
    JobPosting::factory()->create();

    $this->actingAs($owner, 'web')->getJson('/api/employer/job-postings')->assertJsonCount(2, 'data');
    $this->actingAs($this->hrOfficerIn($general), 'web')->getJson('/api/employer/job-postings')
        ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $a->id);
}

public function test_status_filters_use_the_shown_status(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $open = JobPosting::factory()->in($employer)->open()->create();
    $expired = JobPosting::factory()->in($employer)->expired()->create();
    $closed = JobPosting::factory()->in($employer)->closed()->create();
    $this->actingAs($individual, 'web');

    $this->assertSame([$open->id], $this->getJson('/api/employer/job-postings?status=open')->json('data.*.id'));
    $this->assertEqualsCanonicalizing([$expired->id, $closed->id], $this->getJson('/api/employer/job-postings?status=closed')->json('data.*.id'));
    $this->getJson('/api/employer/job-postings?status=archived')->assertUnprocessable();
}

public function test_owners_filter_by_department_and_hr_officers_cannot(): void
{
    [$owner, $company, $general] = $this->companyWithOwner();
    $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
    JobPosting::factory()->in($general)->create();
    $inIt = JobPosting::factory()->in($it)->create();

    $this->actingAs($owner, 'web')->getJson("/api/employer/job-postings?department={$it->id}")
        ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $inIt->id);
    $this->actingAs($this->hrOfficerIn($general), 'web')->getJson("/api/employer/job-postings?department={$it->id}")
        ->assertJsonCount(1, 'data')->assertJsonPath('data.0.department.id', $general->id);
}

public function test_deleted_postings_disappear_but_are_kept(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $posting = JobPosting::factory()->in($employer)->open()->create();
    $this->actingAs($individual, 'web');

    $this->deleteJson("/api/employer/job-postings/{$posting->id}")->assertNoContent();
    $this->getJson('/api/employer/job-postings')->assertJsonCount(0, 'data');
    $this->getJson("/api/employer/job-postings/{$posting->id}")->assertNotFound();
    $this->assertSoftDeleted($posting);
}

public function test_moved_or_removed_hr_officers_lose_their_old_departments_postings(): void
{
    [, $company, $general] = $this->companyWithOwner();
    $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
    $hr = $this->hrOfficerIn($general);
    $posting = JobPosting::factory()->in($general)->create();

    $hr->membership->update(['department_id' => $it->id]);
    $this->actingAs($hr->fresh(), 'web')->putJson("/api/employer/job-postings/{$posting->id}", ['title' => 'Renamed'])
        ->assertForbidden()->assertJsonPath('message', 'You can only manage job postings in your own department.');

    $hr->membership->delete();
    $this->actingAs($hr->fresh(), 'web')->putJson("/api/employer/job-postings/{$posting->id}", ['title' => 'Renamed'])
        ->assertStatus(409)->assertJsonPath('code', 'employer_profile_required');
}

public function test_dashboard_counts_match_what_each_person_may_see(): void
{
    [$owner, $company, $general] = $this->companyWithOwner();
    $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
    JobPosting::factory()->in($general)->open()->create();
    JobPosting::factory()->in($general)->expired()->create();
    JobPosting::factory()->in($it)->pending()->create();
    JobPosting::factory()->in($it)->create();

    $this->actingAs($owner, 'web')->getJson('/api/employer/dashboard')
        ->assertExactJson(['data' => ['postings' => ['draft' => 1, 'pending' => 1, 'open' => 1, 'rejected' => 0, 'closed' => 1]]]);
    $this->actingAs($this->hrOfficerIn($general), 'web')->getJson('/api/employer/dashboard')
        ->assertJsonPath('data.postings.open', 1)->assertJsonPath('data.postings.pending', 0)->assertJsonPath('data.postings.closed', 1);
}
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd backend && php artisan test --filter=JobPostingAccessTest`
Expected: FAIL (405/404 on `GET /api/employer/job-postings`, `DELETE`, `dashboard`).

- [ ] **Step 3: Add `index`, `destroy`, the dashboard controller and the routes** (`GET job-postings`, `DELETE job-postings/{posting}`, `GET dashboard`, all inside the `employer.profile` group). Eager-load `JobPostingResource::RELATIONS`.

- [ ] **Step 4: Run them and see them pass**

Run: `cd backend && php artisan test --filter=JobPostingAccessTest`
Expected: PASS.

---

### Task 5: Close, reopen and change the closing date

**Files:**
- Create: `backend/app/Http/Requests/Employer/PostingStatusRequest.php`, `backend/app/Http/Controllers/Employer/JobPostingStatusController.php`
- Modify: `backend/app/Services/JobPostingWorkflow.php`, `backend/routes/api.php`
- Test: `backend/tests/Feature/Employer/JobPostingStatusTest.php` (uses `BuildsTeams`, `RefreshDatabase`)

**Interfaces:**
- Consumes: Task 3 workflow and policy; `ClosingDate`.
- Produces:
  - `PATCH /api/employer/job-postings/{posting}/status` with `{action: 'close'|'reopen'|'change_closing_date', closes_on?: 'Y-m-d'}` → 200 `JobPostingResource`.
  - `PostingStatusRequest`: `authorize()` like `JobPostingRequest` (403 first); `action` required, `in:close,reopen,change_closing_date` (message `'Choose close, reopen or change_closing_date.'`); `closes_on` `required_unless:action,close` (message `'Choose a new closing date.'`) + `new ClosingDate`.
  - Workflow: `close(JobPosting $posting): JobPosting` (shown Open → stored Closed); `reopen(JobPosting $posting, string $closesOn): JobPosting` (shown Closed → stored Open with the new date; an expired posting keeps stored Open); `changeClosingDate(JobPosting $posting, string $closesOn): JobPosting` (shown Open → new date). None of them touch `approved_at` or `submitted_at`. Refusals are `ValidationException` on key `action`: `'Only open postings can be closed.'`, `'Only closed postings can be reopened.'`, `'Only open postings can have their closing date changed. Reopen a closed posting instead.'`

- [ ] **Step 1: Write the failing tests**

```php
public function test_an_open_posting_closes_and_reopens_without_approval(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $posting = JobPosting::factory()->in($employer)->open()->create();
    $approvedAt = $posting->approved_at;
    $newDate = ClosingDate::earliest()->addDays(10)->toDateString();
    $this->actingAs($individual, 'web');

    $this->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'close'])
        ->assertOk()->assertJsonPath('data.status', 'closed');
    $this->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'reopen', 'closes_on' => $newDate])
        ->assertOk()->assertJsonPath('data.status', 'open')->assertJsonPath('data.closes_on', $newDate);

    $this->assertEquals($approvedAt, $posting->fresh()->approved_at);
}

public function test_an_expired_posting_can_be_reopened(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $posting = JobPosting::factory()->in($employer)->expired()->create();

    $this->actingAs($individual, 'web')
        ->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'reopen', 'closes_on' => ClosingDate::earliest()->toDateString()])
        ->assertOk()->assertJsonPath('data.status', 'open')->assertJsonPath('data.closed_automatically', false);
}

public function test_changing_the_closing_date_keeps_the_posting_open(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $posting = JobPosting::factory()->in($employer)->open()->create();
    $newDate = ClosingDate::latest()->toDateString();

    $this->actingAs($individual, 'web')
        ->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'change_closing_date', 'closes_on' => $newDate])
        ->assertOk()->assertJsonPath('data.status', 'open')->assertJsonPath('data.closes_on', $newDate)
        ->assertJsonPath('data.changed_after_approval', false);
}

public function test_new_dates_must_be_tomorrow_to_six_months_ahead(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $closed = JobPosting::factory()->in($employer)->closed()->create();
    $open = JobPosting::factory()->in($employer)->open()->create();
    $this->actingAs($individual, 'web');

    $this->patchJson("/api/employer/job-postings/{$closed->id}/status", ['action' => 'reopen', 'closes_on' => JobPosting::today()])
        ->assertJsonValidationErrors(['closes_on' => ClosingDate::message()]);
    $this->patchJson("/api/employer/job-postings/{$open->id}/status", ['action' => 'change_closing_date', 'closes_on' => ClosingDate::latest()->addDay()->toDateString()])
        ->assertJsonValidationErrors(['closes_on' => ClosingDate::message()]);
    $this->patchJson("/api/employer/job-postings/{$closed->id}/status", ['action' => 'reopen'])
        ->assertJsonValidationErrors(['closes_on' => 'Choose a new closing date.']);
}

/** @return array<string, array{0: string, 1: string, 2: string}> */
public static function refusedCases(): array
{
    $close = 'Only open postings can be closed.';
    $reopen = 'Only closed postings can be reopened.';
    $change = 'Only open postings can have their closing date changed. Reopen a closed posting instead.';

    return [
        'close a draft' => ['draft', 'close', $close],
        'close a waiting posting' => ['pending', 'close', $close],
        'close a rejected posting' => ['rejected', 'close', $close],
        'close a closed posting' => ['closed', 'close', $close],
        'close an expired posting' => ['expired', 'close', $close],
        'reopen an open posting' => ['open', 'reopen', $reopen],
        'reopen a draft' => ['draft', 'reopen', $reopen],
        'reopen a waiting posting' => ['pending', 'reopen', $reopen],
        'reopen a rejected posting' => ['rejected', 'reopen', $reopen],
        're-date a closed posting' => ['closed', 'change_closing_date', $change],
        're-date an expired posting' => ['expired', 'change_closing_date', $change],
        're-date a draft' => ['draft', 'change_closing_date', $change],
        're-date a waiting posting' => ['pending', 'change_closing_date', $change],
    ];
}

#[DataProvider('refusedCases')]
public function test_other_status_changes_are_refused(string $state, string $action, string $message): void
{
    [$individual, $employer] = $this->individualEmployer();
    $factory = JobPosting::factory()->in($employer);
    $posting = ($state === 'draft' ? $factory : $factory->{$state}())->create();

    $this->actingAs($individual, 'web')
        ->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => $action, 'closes_on' => ClosingDate::earliest()->toDateString()])
        ->assertJsonValidationErrors(['action' => $message]);
}

public function test_hr_officers_cannot_change_another_departments_posting(): void
{
    [, $company, $general] = $this->companyWithOwner();
    $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
    $posting = JobPosting::factory()->in($it)->open()->create();

    $this->actingAs($this->hrOfficerIn($general), 'web')
        ->patchJson("/api/employer/job-postings/{$posting->id}/status", ['action' => 'close'])
        ->assertForbidden();
}
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd backend && php artisan test --filter=JobPostingStatusTest`
Expected: FAIL (405, no route).

- [ ] **Step 3: Write the request, controller (`update` with a `match` on the action), workflow methods and route.** Use `PostingStatus::canTransitionTo()` for the stored change in `close` and `reopen`.

- [ ] **Step 4: Run them and see them pass**

Run: `cd backend && php artisan test --filter=JobPostingStatusTest`
Expected: PASS.

---

### Task 6: Admin approvals

**Files:**
- Create: `backend/app/Http/Controllers/Admin/JobPostingApprovalController.php`
- Modify: `backend/app/Services/JobPostingWorkflow.php`, `backend/app/Http/Controllers/Admin/DashboardController.php`, `backend/routes/api.php`
- Test: `backend/tests/Feature/Admin/PostingApprovalTest.php` (uses `BuildsTeams`, `BuildsPostings`, `RefreshDatabase`)

**Interfaces:**
- Consumes: Task 3 resource and workflow; existing `App\Http\Requests\Admin\DecisionRequest`.
- Produces:
  - `GET /api/admin/job-postings?status=pending|open|rejected` (default `pending`; other values → 422). Pending: `submitted_at` oldest first; open (shown open only) and rejected: `updated_at` newest first. At most 200.
  - `GET /api/admin/job-postings/{posting}`: 404 for drafts.
  - `PATCH /api/admin/job-postings/{posting}/approve` with `DecisionRequest`; 422 on `decision` `'This posting is not waiting for approval.'` unless stored Pending.
  - Workflow: `approve(JobPosting $posting): JobPosting` (stored Open, `approved_at = now()`, `rejection_reason = null`); `reject(JobPosting $posting, string $reason): JobPosting` (stored Rejected, reason saved).
  - Admin dashboard JSON gains `postings_waiting_for_approval`.

- [ ] **Step 1: Write the failing tests**

```php
public function test_the_queue_lists_waiting_postings_oldest_first(): void
{
    $newer = JobPosting::factory()->pending()->create(['submitted_at' => now()->subHour()]);
    $older = JobPosting::factory()->pending()->create(['submitted_at' => now()->subDay()]);
    JobPosting::factory()->create();
    JobPosting::factory()->open()->create();

    $this->actingAs(User::factory()->admin()->create(), 'web')->getJson('/api/admin/job-postings')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $older->id)
        ->assertJsonPath('data.1.id', $newer->id)
        ->assertJsonMissingPath('data.0.actions');
}

public function test_admin_approves_a_waiting_posting(): void
{
    $posting = JobPosting::factory()->pending()->create();

    $this->actingAs(User::factory()->admin()->create(), 'web')
        ->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'approve'])
        ->assertOk()->assertJsonPath('data.status', 'open');

    $this->assertNotNull($posting->fresh()->approved_at);
    $this->getJson('/api/admin/job-postings?status=open')->assertJsonPath('data.0.id', $posting->id);
}

public function test_rejecting_needs_a_reason_and_the_employer_sees_it(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $posting = JobPosting::factory()->in($employer)->pending()->create();

    $this->actingAs(User::factory()->admin()->create(), 'web')
        ->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'reject'])
        ->assertJsonValidationErrors(['reason' => 'Give a reason so they know what to fix.']);
    $this->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'reject', 'reason' => 'Say what the job involves.'])
        ->assertOk()->assertJsonPath('data.status', 'rejected');

    $this->actingAs($individual, 'web')->getJson("/api/employer/job-postings/{$posting->id}")
        ->assertJsonPath('data.rejection_reason', 'Say what the job involves.');
}

public function test_only_waiting_postings_can_be_decided(): void
{
    $this->actingAs(User::factory()->admin()->create(), 'web');

    foreach (['open', 'rejected', 'closed'] as $state) {
        $posting = JobPosting::factory()->{$state}()->create();
        $this->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'approve'])
            ->assertJsonValidationErrors(['decision' => 'This posting is not waiting for approval.']);
    }
}

public function test_admins_never_see_drafts(): void
{
    $draft = JobPosting::factory()->create();
    $this->actingAs(User::factory()->admin()->create(), 'web');

    $this->getJson("/api/admin/job-postings/{$draft->id}")->assertNotFound();
    $this->getJson('/api/admin/job-postings?status=draft')->assertUnprocessable();
}

public function test_an_edited_open_posting_shows_changed_after_approval(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $posting = JobPosting::factory()->in($employer)->open()->create();
    $this->actingAs($individual, 'web')
        ->putJson("/api/employer/job-postings/{$posting->id}", $this->completePosting(['submit' => false]))->assertOk();

    $this->actingAs(User::factory()->admin()->create(), 'web')->getJson("/api/admin/job-postings/{$posting->id}")
        ->assertJsonPath('data.status', 'pending')->assertJsonPath('data.changed_after_approval', true);
}

public function test_approving_a_posting_whose_date_passed_shows_it_as_closed(): void
{
    $posting = JobPosting::factory()->pending()->create(['closes_on' => CarbonImmutable::parse(JobPosting::today())->subDay()]);

    $this->actingAs(User::factory()->admin()->create(), 'web')
        ->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'approve'])
        ->assertOk()->assertJsonPath('data.status', 'closed')->assertJsonPath('data.closed_automatically', true);
}

public function test_dashboard_counts_postings_waiting_for_approval(): void
{
    JobPosting::factory()->count(2)->pending()->create();
    JobPosting::factory()->open()->create();

    $this->actingAs(User::factory()->admin()->create(), 'web')->getJson('/api/admin/dashboard')
        ->assertJsonPath('data.postings_waiting_for_approval', 2);
}

public function test_employers_cannot_use_admin_posting_routes(): void
{
    [$individual, $employer] = $this->individualEmployer();
    $posting = JobPosting::factory()->in($employer)->pending()->create();

    $this->actingAs($individual, 'web')
        ->patchJson("/api/admin/job-postings/{$posting->id}/approve", ['decision' => 'approve'])
        ->assertForbidden();
}
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd backend && php artisan test --filter=PostingApprovalTest`
Expected: FAIL (404s; dashboard key missing).

- [ ] **Step 3: Write the controller (`index`, `show`, `update`), the two workflow methods, the dashboard count and the admin routes.**

- [ ] **Step 4: Run them and see them pass**

Run: `cd backend && php artisan test --filter=PostingApprovalTest`
Expected: PASS.

---

### Task 7: Delete guards, demo postings and the backend commit

**Files:**
- Modify: `backend/app/Http/Controllers/Admin/CategoryController.php` (remove the `TODO(Phase 2)`), `backend/app/Http/Controllers/Employer/DepartmentController.php` (remove the `TODO(Phase 2B)`), `backend/database/seeders/DatabaseSeeder.php` (call `DemoJobPostingSeeder` after `DemoEmployerSeeder`)
- Create: `backend/database/seeders/DemoJobPostingSeeder.php`
- Test: `backend/tests/Feature/Admin/CategoryManagementTest.php`, `backend/tests/Feature/Employer/DepartmentTest.php`, `backend/tests/Feature/MasterData/SeederTest.php`

**Interfaces:**
- Consumes: `JobPosting`, `DemoEmployerSeeder::COMPANY_NAME`, `UserSeeder::DEMO_*_EMAIL` constants, names from `CategorySeeder::CATEGORIES` and `AccommodationSeeder::types()`.
- Produces:
  - Category delete refused (422, key `category`) when any posting, including a deleted one, uses it: `"{name}" is used by job postings, so it can't be deleted. Rename it instead.`
  - Department delete refused (422, key `department`), checked after the HR-officer check: `{name} has job postings (OpenDoor keeps deleted ones too), so it can't be deleted. Rename it instead.`
  - `DemoJobPostingSeeder`: only for an employer that exists and has no postings (`withTrashed`). Closing dates count from `JobPosting::today()`.

    | Title | Employer / department | Created by | Category | Location | Setup · type · interview | Status | Closes in | Accommodations (note) |
    |---|---|---|---|---|---|---|---|---|
    | HR Assistant | Demo company / Human Resources | `hr@` | Administrative & Clerical | Makati City, Metro Manila | on-site, full-time, online or on-site | Open | 45 days | Wheelchair-accessible entrance ("Ramp at the Ayala Avenue entrance."), Accessible restroom, Flexible hours ("Start any time between 7 and 10 a.m."), Job coach or onboarding buddy |
    | Recruitment Coordinator | Demo company / Human Resources | `hr@` | Administrative & Clerical | Makati City, Metro Manila | hybrid, full-time, online | Waiting | 60 days | Hybrid work ("Office days are Tuesday and Thursday."), Written or captioned meetings, Screen-reader-compatible work tools |
    | Junior Web Developer | Demo company / IT | owner | Information Technology | Anywhere in the Philippines | remote, full-time, online | Open | 30 days | Remote work ("Laptop and internet allowance provided."), Flexible hours, Screen reader software provided ("NVDA is installed on the company laptop."), Written or captioned meetings |
    | IT Support Specialist | Demo company / IT | owner | Information Technology | Makati City, Metro Manila | on-site, *(not set)*, *(not set)* | Draft | *(not set)* | *(none yet)* |
    | Part-time Home-based Bookkeeper | Individual employer | `individual@` | Accounting & Finance | Quezon City | remote, part-time, online | Open | 40 days | Remote work, Part-time schedule ("About 20 hours a week; you choose the days."), Flexible hours |

    Each has a two-sentence description of the duties (no salary). Open ones get `submitted_at` and `approved_at`; the waiting one gets `submitted_at`.

- [ ] **Step 1: Write the failing tests**

```php
// CategoryManagementTest
public function test_categories_used_by_postings_cannot_be_deleted(): void
{
    $category = Category::factory()->create(['name' => 'Healthcare']);
    JobPosting::factory()->create(['category_id' => $category->id])->delete();

    $this->deleteJson("/api/admin/categories/{$category->id}")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['category' => '"Healthcare" is used by job postings, so it can\'t be deleted. Rename it instead.']);
    $this->assertModelExists($category);
}

// DepartmentTest
public function test_departments_with_postings_cannot_be_deleted(): void
{
    [$owner, $company] = $this->companyWithOwner();
    $it = $company->departments()->create(['name' => 'IT', 'member_limit' => 2]);
    JobPosting::factory()->in($it)->create()->delete();

    $this->actingAs($owner, 'web')->deleteJson("/api/employer/departments/{$it->id}")
        ->assertJsonValidationErrors(['department' => 'IT has job postings (OpenDoor keeps deleted ones too), so it can\'t be deleted. Rename it instead.']);
}

// SeederTest: extend test_seeding_twice_creates_no_duplicates
$this->assertSame(5, JobPosting::count());
$this->assertSame(['draft' => 1, 'open' => 3, 'pending' => 1], JobPosting::pluck('status')->map->value->countBy()->sortKeys()->all());

JobPosting::first()->delete();
$this->seed(DatabaseSeeder::class);
$this->assertSame(5, JobPosting::withTrashed()->count());
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd backend && php artisan test --filter='CategoryManagementTest|DepartmentTest|SeederTest'`
Expected: 3 failures (category deleted, department deleted, 0 postings seeded).

- [ ] **Step 3: Add the two guards and the seeder; register the seeder.**

- [ ] **Step 4: Run the whole backend suite**

Run: `cd backend && php artisan test`
Expected: PASS, 91 earlier tests plus every 2B test, no failures.

- [ ] **Step 5: Commit the backend**

```bash
git add backend docs/PHASE_2_PLAN.md
git commit -m "Add job postings, approvals and delete guards API (Phase 2B backend)" -m "- job_postings and job_posting_accommodation (notes); statuses draft,
  waiting, open, rejected, closed; closed automatically after the
  closing date (Manila time), no scheduler
- save drafts with just a title; submitting needs every field and an
  accommodation; editing open or closed postings sends them back for
  approval; close, reopen and change closing date need no approval
- department scope: HR officers only their department, owners the whole
  company; each posting lists the actions allowed
- admin approval queue (oldest first) with approve / reject + reason
- categories and departments used by any posting can't be deleted
- employer dashboard counts; five demo postings
- plan: Phase 2B decisions 24-38 and the UI polish direction" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Fill in the final test count in the body before committing (e.g., "- N feature tests").

---

### Task 8: Polish foundations

**Files:**
- Modify: `frontend/src/index.css`, `frontend/src/components/ui/PageHeading.jsx`, `StatusBadge.jsx`, `DashboardTile.jsx`, `FilterTabs.jsx`, `FilterTabs.test.jsx`
- Create: `frontend/src/components/ui/Icon.jsx`, `frontend/src/components/ui/PageHeader.jsx`

**Interfaces:**
- Produces:
  - Tailwind theme additions in `index.css`: `--text-title: 2rem` (line height 1.15), `--text-title-lg: 2.5rem` (line height 1.1), `--animate-reveal: od-reveal 160ms ease-out` with `@keyframes od-reveal` (opacity 0 → 1, `translateY(-4px)` → none). The existing reduced-motion rule already turns it off.
  - `<Icon name className="size-4" />`: inline 24×24 stroke icons (`stroke="currentColor"`, `aria-hidden="true"`, `focusable="false"`). Names: `check`, `cross`, `clock`, `slash`, `pencil`, `lock`, `dot`, `door`, `chat`, `calendar`, `monitor`, `people`.
  - `<StatusBadge tone icon? />`: icons replace the text glyphs; tone defaults `success`→check, `neutral`→slash, `danger`→cross, `info`→clock; `icon` overrides.
  - `PageHeading` classes: `text-title font-bold tracking-tight sm:text-title-lg`.
  - `<PageHeader title documentTitle? intro? actions? />`: `PageHeading` (with `documentTitle` as its `title`), intro paragraph (`max-w-prose`), actions on the right on wide screens and below on phones (`flex flex-wrap items-end justify-between gap-4`).
  - `DashboardTile`: same props; the count uses `text-title leading-none`.
  - `FilterTabs`: keeps the current search parameters and replaces only `param`.

- [ ] **Step 1: Write the failing test** (add to `FilterTabs.test.jsx`)

```jsx
it('keeps the other filters when switching', () => {
  const items = [
    { value: 'open', label: 'Open' },
    { value: 'pending', label: 'Waiting' },
  ]
  renderRoutes([{ path: '/list', element: <FilterTabs label="Posting status" items={items} current="open" /> }], {
    path: '/list?department=4&status=open',
  })

  expect(screen.getByRole('link', { name: 'Waiting' })).toHaveAttribute('href', '/list?department=4&status=pending')
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd frontend && npx vitest run src/components/ui/FilterTabs.test.jsx`
Expected: FAIL, href is `/list?status=pending`.

- [ ] **Step 3: Make the changes above.** `FilterTabs` reads `useSearchParams()`; the existing test (`/?status=pending` at `/`) must keep passing.

- [ ] **Step 4: Run the whole frontend suite and the linter**

Run: `cd frontend && npm run test && npm run lint`
Expected: all tests pass (51 + 1); oxlint reports no errors.

---

### Task 9: Posting building blocks

**Files:**
- Create: `frontend/src/lib/postingOptions.js`, `frontend/src/lib/postingOptions.test.js`, `frontend/src/components/postings/PostingStatusBadge.jsx`, `PostingStatusBadge.test.jsx`, `AccommodationGroupIcon.jsx`, `AccommodationPicker.jsx`, `AccommodationPicker.test.jsx`, `JobDetails.jsx`, `JobDetails.test.jsx`, `ClosingDateDialog.jsx`, `ClosingDateDialog.test.jsx`, `frontend/src/test/postingFixture.js` (one open posting in the Task 3 `JobPostingResource` shape, shared by later page tests)
- Modify: `frontend/src/lib/format.js`

**Interfaces:**
- Consumes: Task 8 `Icon`, `StatusBadge`; existing `VerificationBadge`, `FormField`, `Modal`, `Button`.
- Produces:
  - `postingOptions.js`: `EMPLOYMENT_TYPES`, `WORK_SETUPS`, `INTERVIEW_FORMATS` (`[{ value, label }]`, values and labels as in Task 1); `optionLabel(options, value): string` (`''` when unknown); `POSTING_FILTERS` = All `all`, Open `open`, Waiting `pending`, Drafts `draft`, Rejected `rejected`, Closed `closed`; `manilaToday(now = new Date()): string` (`Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' })`); `closingDateRange(now = new Date()): { min, max }` (min = Manila today + 1 day; max = Manila today + 6 months, day clamped to the last day of that month, the same as Carbon's `addMonthsNoOverflow`).
  - `format.js`: `formatDay(day: 'YYYY-MM-DD'): string` → `'November 30, 2026'` in every time zone (format the UTC date with `timeZone: 'UTC'`).
  - `<PostingStatusBadge status />`: draft → neutral + pencil "Draft"; pending → info + clock "Waiting for approval"; open → success + check "Open"; rejected → danger + cross "Rejected"; closed → neutral + lock "Closed".
  - `<AccommodationGroupIcon group />`: Physical access → door, Communication → chat, Work arrangement → calendar, Assistive technology → monitor, Support → people, any other group → dot.
  - `<AccommodationPicker id legend hint groups value onChange error noteErrors withNotes={true} />`:
    - `groups`: `[{ group, accommodations: [{ id, name, description, is_active }] }]`; `value`: `[{ id, note }]`; `onChange(nextValue)` keeps the picker's display order; `noteErrors`: `{ [id]: message }`.
    - Outer `<fieldset id={id} tabIndex={-1}>` (so an error summary link can move focus to it) with legend, hint and error; one inner fieldset per group (legend = group icon + name).
    - Checkbox `accommodation-{id}`, label = name (inactive ones: `"{name} (no longer offered)"`), description as its hint.
    - When ticked and `withNotes`: `FormField` `accommodation-{id}-note`, label `Note about {name}`, `optional`, hint "For example, where it is or how to ask for it.", `maxLength={255}`, wrapped in `animate-reveal`.
  - `<JobDetails posting showVerificationStatus={false} />` (§4.10): employer line (name; company → `VerificationBadge` only when verified, or any status when `showVerificationStatus`; individual → "Individual employer"; "Department: {name}" when present); then `<section>`s with `h2` **Accommodations provided** (`border-l-4 border-accent`, grouped with `AccommodationGroupIcon` + `h3`, check icon + name + note), **At a glance** (`dl`: Work setup, Employment type, Location, Interview format, Apply by → `formatDay(closes_on)`, Category), **About the job** (`whitespace-pre-line`). DOM order is accommodations, at a glance, description; on `lg` the description sits in the left column and the other two on the right (grid placement). Missing values show "Not added yet"; no accommodations shows "No accommodations added yet."
  - `<ClosingDateDialog open onOpenChange title description confirmLabel initialDate onConfirm busy error onCloseAutoFocus />`: `Modal` with a form; date input `closes-on-dialog`, label "New closing date", hint `Between {formatDay(min)} and {formatDay(max)}.`, `min`/`max` from `closingDateRange()`; empty → "Choose a new closing date."; outside the range → `Choose a closing date between {min} and {max}.` (formatted); `onConfirm('YYYY-MM-DD')`.

- [ ] **Step 1: Write the failing tests**

```js
// postingOptions.test.js
it('uses Manila dates for the closing date range', () => {
  expect(closingDateRange(new Date('2026-10-05T02:00:00Z'))).toEqual({ min: '2026-10-06', max: '2027-04-05' })
  expect(closingDateRange(new Date('2026-10-05T16:30:00Z'))).toEqual({ min: '2026-10-07', max: '2027-04-06' })
})
it('clamps six months to the end of a shorter month', () => {
  expect(closingDateRange(new Date('2026-08-31T02:00:00Z')).max).toBe('2027-02-28')
})
it('rolls tomorrow over the end of the year', () => {
  expect(closingDateRange(new Date('2026-12-31T02:00:00Z')).min).toBe('2027-01-01')
})
it('formats date-only values without shifting the day', () => {
  expect(formatDay('2026-11-30')).toBe('November 30, 2026')
})
```

```jsx
// PostingStatusBadge.test.jsx
it.each([
  ['draft', 'Draft'],
  ['pending', 'Waiting for approval'],
  ['open', 'Open'],
  ['rejected', 'Rejected'],
  ['closed', 'Closed'],
])('shows %s as text', (status, label) => {
  render(<PostingStatusBadge status={status} />)
  expect(screen.getByText(label)).toBeInTheDocument()
})

// AccommodationPicker.test.jsx (a small stateful Harness renders the picker with useState)
it('shows a note field only for ticked accommodations', async () => {
  render(<Harness />)
  expect(screen.queryByLabelText(/Note about Remote work/)).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Remote work' }))
  expect(screen.getByLabelText(/Note about Remote work/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Remote work' }))
  expect(screen.queryByLabelText(/Note about Remote work/)).not.toBeInTheDocument()
})
it('marks retired accommodations as no longer offered', () => {
  render(<Harness initial={[{ id: 3, note: '' }]} retired />)
  expect(screen.getByRole('checkbox', { name: 'Accessible parking (no longer offered)' })).toBeChecked()
})
it('has no accessibility violations', async () => {
  const { container } = render(<Harness initial={[{ id: 1, note: 'Laptop provided' }]} />)
  expect(await axe(container)).toHaveNoViolations()
})

// JobDetails.test.jsx
it('puts accommodations with their notes first', () => {
  render(<JobDetails posting={posting} />)
  const panel = screen.getByRole('region', { name: 'Accommodations provided' })
  expect(within(panel).getByText('Remote work')).toBeInTheDocument()
  expect(within(panel).getByText('Laptop and internet allowance provided.')).toBeInTheDocument()
})
it('says when the employer is an individual', () => {
  render(<JobDetails posting={{ ...posting, employer: { ...posting.employer, type: 'individual' }, department: null }} />)
  expect(screen.getByText('Individual employer')).toBeInTheDocument()
})
it('marks missing details on drafts', () => {
  render(<JobDetails posting={{ ...posting, location: null }} />)
  expect(screen.getByText('Not added yet')).toBeInTheDocument()
})
it('has no accessibility violations', async () => {
  const { container } = render(<JobDetails posting={posting} />)
  expect(await axe(container)).toHaveNoViolations()
})

// ClosingDateDialog.test.jsx (vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-05T02:00:00Z')))
it('needs a date in the allowed range', async () => {
  const onConfirm = vi.fn()
  render(<ClosingDateDialog open onOpenChange={() => {}} title="Reopen" confirmLabel="Reopen posting" onConfirm={onConfirm} />)
  await userEvent.click(screen.getByRole('button', { name: 'Reopen posting' }))
  expect(screen.getByLabelText('New closing date')).toHaveAccessibleDescription(/Choose a new closing date\./)
  expect(onConfirm).not.toHaveBeenCalled()

  fireEvent.change(screen.getByLabelText('New closing date'), { target: { value: '2026-11-30' } })
  await userEvent.click(screen.getByRole('button', { name: 'Reopen posting' }))
  expect(onConfirm).toHaveBeenCalledWith('2026-11-30')
})
```

(`posting` in `JobDetails.test.jsx` is the shared `src/test/postingFixture.js` fixture: one "Work arrangement" accommodation, "Remote work", with the note "Laptop and internet allowance provided.")

- [ ] **Step 2: Run them and see them fail**

Run: `cd frontend && npx vitest run src/lib src/components/postings`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write the modules and components** to the interfaces above.

- [ ] **Step 4: Run them, then the whole suite and the linter**

Run: `cd frontend && npx vitest run src/lib src/components/postings && npm run test && npm run lint`
Expected: PASS; no lint errors.

---

### Task 10: Employer job postings list

**Files:**
- Create: `frontend/src/api/jobPostings.js`, `frontend/src/portals/employer/JobPostingsPage.jsx`, `frontend/src/portals/employer/JobPostingsPage.test.jsx`, `frontend/src/portals/employer/postings/PostingListItem.jsx`
- Modify: `frontend/src/router.jsx`, `frontend/src/components/layout/portalMenus.js`, `portalMenus.test.js`, `frontend/src/components/layout/PortalLayout.jsx`

**Interfaces:**
- Consumes: Task 8 `PageHeader`, `FilterTabs`; Task 9 `PostingStatusBadge`, `ClosingDateDialog`, `POSTING_FILTERS`, `formatDay`; existing `getDepartments()`, `ConfirmDialog`, `Notice`, `useAnnounce`.
- Produces:
  - `api/jobPostings.js`: `getJobPostings({ status, department } = {})` → array; `getJobPosting(id)`; `createJobPosting(values)`; `updateJobPosting(id, values)`; `deleteJobPosting(id)`; `changePostingStatus(id, action, closesOn)` (sends `{ action, closes_on }`) → posting.
  - Route `/employer/job-postings` (kinds owner, hr, individual).
  - Menus: owner Dashboard, Company profile, Team, Job postings; HR Dashboard, Job postings; individual Dashboard, My profile, Job postings. The Job postings item has `end: false`; `PortalLayout` uses `end={item.end ?? true}` so the item stays marked on sub-pages.
  - The page reads `location.state?.message` once (shown in a success `Notice`, announced, then cleared with `navigate(…, { replace: true, state: null })`).
  - `<PostingListItem posting showDepartment showCreator onAction />`: `<li id="posting-{id}">`; `h3` link to `/employer/job-postings/{id}` (the preview); `PostingStatusBadge`; details as separate labelled items (Department, Closes / "No closing date yet", "{n} accommodations", "Created by {name}" for owners); rejected → "Reason: {reason}"; closed automatically → "The closing date passed on {date}."; actions from `posting.actions`: Edit (link `/employer/job-postings/{id}/edit`), Change closing date, Close, Reopen, Delete (buttons), each with `aria-label="{Action} {title}"`; `onAction(action, posting)`.
  - Owners of companies get a "Department" `SelectField` (`department-filter`, first option "All departments") that sets `?department=`; HR officers and individuals don't (and never call `getDepartments`).
  - Dialogs and copy:

    | Action | Dialog title | Description | Confirm | Success message |
    |---|---|---|---|---|
    | Close | Close "{title}"? | Job seekers won't see it until you reopen it. Reopening doesn't need a new approval. | Close posting (primary) | "{title}" is closed. |
    | Reopen | Reopen "{title}" | Choose a new closing date. Reopening doesn't need a new approval. | Reopen posting | "{title}" is open again until {date}. |
    | Change closing date | Change the closing date of "{title}" | The posting stays open. Changing only the date doesn't need a new approval. | Change closing date | "{title}" now closes on {date}. |
    | Delete | Delete "{title}"? | It disappears from your job postings and from OpenDoor. This can't be undone. | Delete posting (danger) | "{title}" was deleted. |

  - After an action: reload the list, show and announce the message; if the row is gone, `onCloseAutoFocus` moves focus to the list heading (`h2`, `tabIndex={-1}`, text "{filter label} ({count})").
  - Empty states: all "No job postings yet. Create one now, or save it as a draft and finish it later." (with the create link); open "No open postings. Postings open after an OpenDoor admin approves them."; pending "Nothing is waiting for approval."; draft "No drafts."; rejected "No rejected postings."; closed "No closed postings."
  - Header: title "Job postings"; intro (owner) "Every job posting at {company}. HR officers see only their own department's postings." / (HR) "Job postings for {department} at {company}." / (individual) "Your job postings."; action link "Create a job posting" → `/employer/job-postings/new`.

- [ ] **Step 1: Write the failing tests**

```js
// portalMenus.test.js: update the expectations
expect(labels(owner)).toEqual(['Dashboard', 'Company profile', 'Team', 'Job postings'])
expect(labels(hr)).toEqual(['Dashboard', 'Job postings'])
expect(labels(individual)).toEqual(['Dashboard', 'My profile', 'Job postings'])
```

```jsx
// JobPostingsPage.test.jsx (vi.mock('../../api/jobPostings.js') and vi.mock('../../api/employer.js'))
it('shows only the actions the server allows', async () => {
  getJobPostings.mockResolvedValue([
    { ...fixture, id: 1, title: 'Data encoder', status: 'draft', actions: ['edit', 'delete'] },
    { ...fixture, id: 2, title: 'Junior Web Developer', status: 'open', actions: ['edit', 'close', 'change_closing_date', 'delete'] },
  ])
  renderRoutes(routes, { path: '/employer/job-postings', auth: individual })

  expect(await screen.findByRole('button', { name: 'Close Junior Web Developer' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Close Data encoder' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Edit Data encoder' })).toHaveAttribute('href', '/employer/job-postings/1/edit')
})
it('gives company owners a department filter but not HR officers', async () => {
  getJobPostings.mockResolvedValue([])
  getDepartments.mockResolvedValue({ departments: [{ id: 5, name: 'IT' }], cap: 10, defaultLimit: 3 })
  renderRoutes(routes, { path: '/employer/job-postings', auth: owner })
  expect(await screen.findByLabelText('Department')).toBeInTheDocument()

  cleanup()
  renderRoutes(routes, { path: '/employer/job-postings', auth: hr })
  await screen.findByText(/No job postings yet/)
  expect(screen.queryByLabelText('Department')).not.toBeInTheDocument()
  expect(getDepartments).toHaveBeenCalledTimes(1)
})
it('says what to do when there are no postings', async () => {
  getJobPostings.mockResolvedValue([])
  renderRoutes(routes, { path: '/employer/job-postings', auth: individual })
  expect(await screen.findByText(/No job postings yet/)).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: 'Create a job posting' })[0]).toHaveAttribute('href', '/employer/job-postings/new')
})
it('has no accessibility violations', async () => {
  getJobPostings.mockResolvedValue([{ ...fixture, actions: ['edit', 'delete'] }])
  const { container } = renderRoutes(routes, { path: '/employer/job-postings', auth: individual })
  await screen.findByRole('heading', { level: 3 })
  expect(await axe(container)).toHaveNoViolations()
})
```

(`owner`, `hr` and `individual` are auth objects in the shape used by `EmployerRoutes.test.jsx`; `fixture` is the Task 9 `src/test/postingFixture.js`.)

- [ ] **Step 2: Run them and see them fail**

Run: `cd frontend && npx vitest run src/portals/employer/JobPostingsPage.test.jsx src/components/layout/portalMenus.test.js`
Expected: FAIL.

- [ ] **Step 3: Write the API module, list item, page, route, menu items and the `end` change.**

- [ ] **Step 4: Run them, the whole suite and the linter**

Run: `cd frontend && npm run test && npm run lint`
Expected: PASS; no lint errors.

---

### Task 11: Create and edit form

**Files:**
- Create: `frontend/src/portals/employer/postings/postingForm.js`, `postingForm.test.js`, `frontend/src/portals/employer/JobPostingFormPage.jsx`, `JobPostingFormPage.test.jsx`
- Modify: `frontend/src/router.jsx` (`/employer/job-postings/new`, `/employer/job-postings/:id/edit`)

**Interfaces:**
- Consumes: Task 9 `AccommodationPicker`, `postingOptions`; Task 10 `api/jobPostings.js`; existing `getCategories`, `getAccommodationGroups`, `getDepartments`, `getEmployerProfile`, `useFormErrors`, `ErrorSummary`, `summaryFrom`, `FormField`, `SelectField`, `RadioCardGroup`.
- Produces:
  - `postingForm.js`:
    - `FORM_FIELDS = ['title', 'department_id', 'category_id', 'description', 'location', 'work_setup', 'employment_type', 'interview_format', 'accommodations', 'closes_on']`
    - `emptyValues({ location = '', departmentId = '' } = {})` and `valuesFrom(posting)` → `{ title, department_id, category_id, description, location, work_setup, employment_type, interview_format, closes_on, accommodations: [{ id, note }] }` (strings, `''` for missing)
    - `validatePosting(values, { submitting, needsDepartment, range }) → { field: message }` with the Task 3 messages (closing date range message built with `formatDay`)
    - `payloadFrom(values, { submit, needsDepartment })` → API body: empty strings become `null`, ids become numbers, notes trimmed (blank → `null`), `department_id` only when `needsDepartment`
    - `fieldIdFor(key, values)`: `work_setup` → `work_setup-on_site`, `employment_type` → `employment_type-full_time`, `interview_format` → `interview_format-online`, `accommodations` → the outer picker fieldset id `accommodations`, `accommodations.{n}.note` → `accommodation-{values.accommodations[n].id}-note`, `accommodations.{n}.id` → `accommodation-{id}`; others unchanged.
  - Page: loads categories, accommodation groups, departments (company owners only; preselect when there is exactly one), the posting (edit) or the employer profile address (create, pre-fills Location). Retired accommodations already on the posting are merged into their group with `is_active: false`.
  - Sections (`h2`): The job (Job title; Department for company owners; Category; Description, hint "What the job involves and who it suits. Job seekers see this."), Where and how (Location, hint "For remote jobs, e.g., \"Anywhere in the Philippines\"."; Work setup; Employment type; Interview format, as `RadioCardGroup`s), Accommodations you provide (`AccommodationPicker`, hint "Tick everything your workplace provides for this job. Job seekers see these first, with your notes."), Closing date (`closes_on`, `type="date"`, hint "Between {min} and {max}. Applications close at the end of that day, Philippine time.").
  - Buttons and notices by stored status (`submitting` = the primary button, or status pending/open/closed):

    | Status | Notice | Primary (`submit`) | Secondary (`submit`) |
    |---|---|---|---|
    | new, draft | none | Submit for approval (true) | Save draft (false) |
    | rejected | "An OpenDoor admin rejected this posting. Reason: {reason} Make your changes, then resubmit it." | Resubmit for approval (true) | Save changes (false) |
    | pending | "This posting is waiting for approval. Your changes go to the same review." | Save changes (false) | none |
    | open | "Saving changes sends this posting back to an OpenDoor admin. Job seekers won't see it until it is approved again. To change only the closing date, use Change closing date on the Job postings page." | Save and send for approval (false) | none |
    | closed | "Saving changes sends this posting to an OpenDoor admin for approval. To open it again without changes, use Reopen on the Job postings page." | Save and send for approval (false) | none |

    Plus a "Cancel" link back to `/employer/job-postings`.
  - After saving, navigate to `/employer/job-postings` with `state.message`: new/draft saved as draft → `"{title}" was saved as a draft.`; anything that becomes pending from draft, rejected or new → `"{title}" was sent for approval. An OpenDoor admin will review it.`; rejected kept → `Changes to "{title}" were saved. It stays rejected until you resubmit it.`; pending kept → `Changes to "{title}" were saved. It is still waiting for approval.`; open or closed → `"{title}" was sent for approval again. Job seekers won't see it until it is approved.`
  - Page title: "Create a job posting" or "Edit {title}".

- [ ] **Step 1: Write the failing tests**

```js
// postingForm.test.js
const range = { min: '2026-10-06', max: '2027-04-05' }
it('needs only a title for a draft, plus a department for company owners', () => {
  expect(validatePosting(emptyValues(), { submitting: false, needsDepartment: false, range })).toEqual({ title: 'Enter a job title.' })
  expect(validatePosting({ ...emptyValues(), title: 'Clerk' }, { submitting: false, needsDepartment: true, range }))
    .toEqual({ department_id: 'Choose the department this job is in.' })
})
it('needs every field and an accommodation to submit', () => {
  const errors = validatePosting({ ...emptyValues(), title: 'Clerk' }, { submitting: true, needsDepartment: false, range })
  expect(Object.keys(errors)).toEqual(['category_id', 'description', 'location', 'work_setup', 'employment_type', 'interview_format', 'accommodations', 'closes_on'])
  expect(errors.accommodations).toBe('Choose at least one accommodation your workplace provides.')
})
it('explains the allowed closing dates', () => {
  const values = { ...completeValues, closes_on: '2027-05-01' }
  expect(validatePosting(values, { submitting: true, needsDepartment: false, range }).closes_on)
    .toBe('Choose a closing date between October 6, 2026 and April 5, 2027.')
})
it('sends numbers, nulls and trimmed notes', () => {
  const body = payloadFrom({ ...emptyValues(), title: 'Clerk', category_id: '3', accommodations: [{ id: 7, note: '  Ramp  ' }, { id: 8, note: '   ' }] }, { submit: false, needsDepartment: false })
  expect(body).toMatchObject({ title: 'Clerk', category_id: 3, location: null, submit: false, accommodations: [{ id: 7, note: 'Ramp' }, { id: 8, note: null }] })
  expect(body).not.toHaveProperty('department_id')
})
```

```jsx
// JobPostingFormPage.test.jsx (mocks: api/masterData.js, api/employer.js, api/jobPostings.js)
it('lets company owners choose the department, but not HR officers', async () => {
  renderRoutes(routes, { path: '/employer/job-postings/new', auth: owner })
  expect(await screen.findByLabelText('Department')).toBeInTheDocument()

  cleanup()
  renderRoutes(routes, { path: '/employer/job-postings/new', auth: hr })
  await screen.findByLabelText('Job title')
  expect(screen.queryByLabelText('Department')).not.toBeInTheDocument()
})
it('lists what is missing when submitting an empty posting', async () => {
  renderRoutes(routes, { path: '/employer/job-postings/new', auth: hr })
  await userEvent.click(await screen.findByRole('button', { name: 'Submit for approval' }))

  const summary = screen.getByRole('heading', { name: 'There is a problem' }).parentElement
  expect(summary).toHaveFocus()
  expect(within(summary).getByRole('link', { name: 'Enter a job title.' })).toBeInTheDocument()
  expect(createJobPosting).not.toHaveBeenCalled()
})
it('warns before sending an open posting back for approval', async () => {
  getJobPosting.mockResolvedValue({ ...fixture, status: 'open', actions: ['edit', 'close', 'change_closing_date', 'delete'] })
  renderRoutes(routes, { path: '/employer/job-postings/2/edit', auth: individual })

  expect(await screen.findByRole('button', { name: 'Save and send for approval' })).toBeInTheDocument()
  expect(screen.getByText(/Job seekers won't see it until it is approved again/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd frontend && npx vitest run src/portals/employer/postings src/portals/employer/JobPostingFormPage.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Write `postingForm.js`, the page and the two routes.** Map API field errors to element ids with `fieldIdFor` before building the error summary (the `SetupPage` `FIELD_IDS` pattern), and pass per-note errors to the picker.

- [ ] **Step 4: Run them, the whole suite and the linter**

Run: `cd frontend && npm run test && npm run lint`
Expected: PASS; no lint errors.

---

### Task 12: Preview page, dashboards and the category guard message

**Files:**
- Create: `frontend/src/portals/employer/JobPostingPreviewPage.jsx`, `frontend/src/portals/admin/CategoriesPage.test.jsx`
- Modify: `frontend/src/router.jsx` (`/employer/job-postings/:id`), `frontend/src/api/employer.js`, `frontend/src/portals/employer/EmployerDashboard.jsx`, `frontend/src/portals/admin/AdminDashboard.jsx`, `frontend/src/portals/admin/CategoriesPage.jsx`

**Interfaces:**
- Consumes: Task 9 `JobDetails`, `PostingStatusBadge`; Task 10 `getJobPosting`.
- Produces:
  - `getEmployerDashboard()` in `api/employer.js` → `{ postings: { draft, pending, open, rejected, closed } }`.
  - Preview: `PageHeader` (title = posting title, documentTitle `Preview: {title}`, intro "This is how job seekers will see your posting once it's open.", action "Edit posting" link when `actions` includes `edit`); status badge; rejected → `Notice` "Reason: {reason}"; `JobDetails`; "Back to job postings" link. Errors: 403/404 → `Notice` with the server message (404: "This posting doesn't exist or was deleted.").
  - Employer dashboard: the "Job postings" tile (title "{department} job postings" for HR officers) lists the non-zero counts as text ("2 open", "1 waiting for approval", "1 draft", "1 rejected", "1 closed"), or "No job postings yet."; link "Manage job postings" → `/employer/job-postings`. Remove the `comingSoon` posting tiles.
  - Admin dashboard: "Posting approvals" tile with `count={postings_waiting_for_approval}`, text "Job postings waiting for approval before job seekers can see them.", link "Review postings" → `/admin/job-postings`.
  - `CategoriesPage` delete: the dialog shows `fieldErrorsFrom(error).category ?? generalErrorFrom(error)`; description becomes "Categories that job postings use can't be deleted; rename them instead. This can't be undone."

- [ ] **Step 1: Write the failing test**

```jsx
// CategoriesPage.test.jsx (mock api/masterData.js)
it('explains why a category in use cannot be deleted', async () => {
  getCategories.mockResolvedValue([{ id: 1, name: 'Healthcare' }])
  deleteCategory.mockRejectedValue({
    response: { status: 422, data: { errors: { category: ['"Healthcare" is used by job postings, so it can\'t be deleted. Rename it instead.'] } } },
  })
  renderRoutes([{ path: '/', element: <CategoriesPage /> }])

  await userEvent.click(await screen.findByRole('button', { name: 'Delete Healthcare' }))
  await userEvent.click(screen.getByRole('button', { name: 'Delete category' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('is used by job postings')
})
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd frontend && npx vitest run src/portals/admin/CategoriesPage.test.jsx`
Expected: FAIL (the dialog shows no message for a 422).

- [ ] **Step 3: Make the changes above.**

- [ ] **Step 4: Run the whole suite and the linter**

Run: `cd frontend && npm run test && npm run lint`
Expected: PASS; no lint errors.

---

### Task 13: Admin posting approvals and review

**Files:**
- Create: `frontend/src/portals/admin/PostingApprovalsPage.jsx`, `frontend/src/portals/admin/PostingReviewPage.jsx`, `PostingReviewPage.test.jsx`
- Modify: `frontend/src/api/admin.js`, `frontend/src/router.jsx`, `frontend/src/components/layout/portalMenus.js`, `portalMenus.test.js`

**Interfaces:**
- Consumes: Task 8 `PageHeader`, `FilterTabs`; Task 9 `JobDetails`, `PostingStatusBadge`, `formatDay`; existing `ConfirmDialog`, `ReasonDialog`, `VerificationBadge`.
- Produces:
  - `api/admin.js`: `getPostingQueue(status)`, `getPostingForReview(id)`, `decidePosting(id, decision, reason)`.
  - Routes `/admin/job-postings`, `/admin/job-postings/:id`; admin menu gains "Posting approvals" (`end: false`) after "Employer verification".
  - Approvals page: `PageHeader` "Posting approvals" (intro "Check each posting before job seekers can see it."); `FilterTabs` Waiting `pending` (default), Open `open`, Rejected `rejected`; list heading "{tab} ({count})"; each item: title link to `/admin/job-postings/{id}`, `PostingStatusBadge`, employer name with `VerificationBadge` (company, any status) or "Individual employer", department, category, "Submitted {date}", info badge "Changed after approval" when flagged, "Reason: {reason}" on the Rejected tab. Empty: Waiting "No postings are waiting for approval."; Open "No open postings."; Rejected "No rejected postings." Shows and announces `location.state.message`.
  - Review page: `PageHeader` (title = posting title, documentTitle `Review: {title}`, intro "Job seekers see this posting once you approve it."); status badge; "Submitted {date}"; `Notice` "This posting was approved before and has since been changed. Check the changes." when `changed_after_approval`; `Notice` "The closing date has passed. If you approve it, it shows as Closed until the employer reopens it with a new date." when `closes_on` < `manilaToday()`; `JobDetails showVerificationStatus`; for pending only: "Approve" and "Reject" buttons → `ConfirmDialog` (title `Approve "{title}"?`, description "Job seekers can see it until {closing date}.", confirm "Approve posting", primary) / `ReasonDialog` (title `Reject "{title}"?`, description "The employer will see your reason.", hint "Say what to fix, e.g., the description doesn't say what the job involves.", confirm "Reject posting"). Success → navigate to `/admin/job-postings` with message `"{title}" is approved and open to job seekers.` / `"{title}" was rejected. The employer can see your reason.`

- [ ] **Step 1: Write the failing tests**

```js
// portalMenus.test.js
expect(labels({ role: 'admin' })).toContain('Posting approvals')
```

```jsx
// PostingReviewPage.test.jsx (mock api/admin.js)
it('offers approve and reject only for waiting postings', async () => {
  getPostingForReview.mockResolvedValue({ ...fixture, status: 'pending', changed_after_approval: true })
  renderRoutes(routes, { path: '/admin/job-postings/2', auth: admin })

  expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
  expect(screen.getByText(/approved before and has since been changed/)).toBeInTheDocument()

  cleanup()
  getPostingForReview.mockResolvedValue({ ...fixture, status: 'open' })
  renderRoutes(routes, { path: '/admin/job-postings/2', auth: admin })
  await screen.findByRole('heading', { level: 1 })
  expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd frontend && npx vitest run src/portals/admin/PostingReviewPage.test.jsx src/components/layout/portalMenus.test.js`
Expected: FAIL.

- [ ] **Step 3: Write the API functions, both pages, routes and the menu item.**

- [ ] **Step 4: Run the whole suite and the linter**

Run: `cd frontend && npm run test && npm run lint`
Expected: PASS; no lint errors.

---

### Task 14: Visual polish pass (frontend-design)

**Files:** any of the Task 8–13 frontend files the critique touches.

- [ ] **Step 1: Bring the local database up to date**

Run: `cd backend && php artisan migrate && php artisan db:seed`
Expected: the two 2B migrations run; "Demo job postings created" (or similar) once; nothing else changes.

- [ ] **Step 2: Screenshot and critique** in the in-app browser at desktop width and at 360 px, logged in with the demo accounts from the README: employer dashboard, Job postings (each filter), Create posting (empty and with errors), Edit (open posting warning), Preview, admin dashboard, Posting approvals, Review, plus Team and Employer verification (shared polish). Check against §4.10: accommodations panel is the one bold element; amber only there; headings follow the scale; lists are ruled rows; no sideways scrolling (`document.documentElement.scrollWidth <= window.innerWidth`); focus ring visible; nothing generic from the "Avoided" row.

- [ ] **Step 3: Fix what the critique finds; repeat Step 2 for the changed pages.**

- [ ] **Step 4: Run the suites and the linter**

Run: `cd frontend && npm run test && npm run lint`
Expected: PASS; no lint errors.

---

### Task 15: Error checks (Superpowers and GSD) and fixes

**Files:** whatever the confirmed findings touch, plus a regression test per fixed bug.

- [ ] **Step 1: Superpowers code review.** Invoke `superpowers:requesting-code-review` for the changes since `e78e4aa` (committed backend plus the uncommitted frontend), with this plan and the spec as the requirements.

- [ ] **Step 2: GSD reviews, in parallel.** Spawn the `gsd-code-reviewer` (standard depth, files from `git diff --name-only e78e4aa` plus untracked 2B files), `gsd-ui-auditor` (six-pillar audit of the Task 8–13 files against §4.10 and the Global Constraints) and `gsd-security-auditor` (verify the Threat model table above) agents. There is no `.planning/` folder (decision 38): give each agent the file list and the spec paths, and have it write its report to the session scratchpad.

- [ ] **Step 3: Triage with `superpowers:receiving-code-review`.** Check each finding against the code; list confirmed, rejected (with the reason) and deferred findings for the user.

- [ ] **Step 4: Fix each confirmed bug test-first** (failing test, fix, passing test).

- [ ] **Step 5: Run everything**

Run: `cd backend && php artisan test` and `cd frontend && npm run test && npm run lint`
Expected: PASS; no lint errors.

---

### Task 16: Demo walk-through, docs and the frontend commit

**Files:**
- Modify: `docs/PHASE_2_PLAN.md` (status line; new "Phase 2B build notes" section like the 2A one), `README.md` (Phase 2 done; demo postings; mention the Job postings and Posting approvals pages in the demo logins table)

- [ ] **Step 1: Walk through B1–B6** in the in-app browser with the demo accounts (B1 with `hr@` in Human Resources, as the seeded HR officer belongs there; B4 with `hr@` against an IT posting and with a second company registered through the UI). Expected results as in §2 of the spec.

- [ ] **Step 2: B7** — A1, A4, A5, B1 and B2 again with only the keyboard at 360 px wide. Expected: every step works; `document.documentElement.scrollWidth <= 360` on every page.

- [ ] **Step 3: Verify before claiming done.** Invoke `superpowers:verification-before-completion`; run both suites and the linter fresh and note the counts.

- [ ] **Step 4: Update the docs** with the counts and anything found in Steps 1–2.

- [ ] **Step 5: Commit the frontend**

```bash
git add frontend docs/PHASE_2_PLAN.md README.md backend
git commit -m "Add job postings, approvals and UI polish (Phase 2B)" -m "<bullets: pages, building blocks, polish, review fixes, test counts>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`backend` is included only if Task 15 fixed something there, as the 2A frontend commit did.)
