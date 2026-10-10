# Phase 3 Plan: Candidate Side

> Status: **DRAFT, waiting for your answers.** Nothing in this plan is built yet. Answer the seven questions in §3.1, and name any recommendation in §3.2 you'd change; "the other recommendations are OK" approves the rest.
> Part of: [CONCEPT_PLAN.md](CONCEPT_PLAN.md), build phase 3 of 7
> Builds on: [PHASE_2_PLAN.md](PHASE_2_PLAN.md) (employers, departments and job postings with structured accommodations)
> Written 2026-10-10 with Superpowers brainstorming (read the project, compare approaches, write this spec for your review), GSD (project state check; the plans moved into `.planning/`) and Frontend Design (§4.7).

---

## 0. Where the project stands

**Built so far (Phases 1, 2A and 2B):** accounts and roles; job categories and 18 accommodation types; companies with departments, HR invites and verification; individual employers; job postings with accommodations, admin approval, closing dates, close and reopen. 159 server tests and 124 page tests pass.

**Why Phase 3 is next.** OpenDoor's first differentiator, *matching on needs* (CONCEPT_PLAN §1), is half built. Employers now publish structured **offers** (the accommodations on each posting), but job seekers can't record their **needs** yet, and nobody outside the employer and admin portals can see a posting. Phase 4 (applications) needs both: a public job page to apply from, and a candidate profile to apply with.

**What earlier plans handed to Phase 3:**
- **Concept plan, phase 3:** M2 profile and needs (with an optional private disability type); M5 search, category and accommodation filters, match mode, sort, pages, filters kept in the address, and a live result count.
- **Phase 2** (§6 and decision 2): the public job list with search, filters and "Matches my needs"; the public job page (the 2B Preview layout was built for it); the public employer page.
- **Phase 2B build notes:** a slimmer posting shape for the public page (the employer one includes the verification status), the 540 kB JavaScript bundle, and lists that stop at 200 rows without saying so.

**Found while checking the project (outside the phase plans):**
- **OpenDoor isn't online yet.** The code is now on GitHub at [ryujiinnn08/opendoor](https://github.com/ryujiinnn08/opendoor) (public), on the branch `feature/opendoor-web-app`. The repository's `main` branch holds the System Integration and Architecture Lab 05 (a Node.js microservices slice of OpenDoor), and how the two share `main` is still to be decided. The backend has no Railway setup (no Dockerfile) and nothing is deployed to Cloudflare. The concept plan wanted the skeleton deployed in Phase 0 so that "deploy is never a last-week surprise"; Phase 1 postponed it until the domain was confirmed. See question 1.
- **The proposal papers aren't in the repository.** The concept plan cites feature numbers (F4.6, F7.6), but the *Modules and Features Specification* isn't here, so I can't check that every M2 and M5 feature is covered. See question 3.
- **The plans moved.** At your request, every plan moved from `docs/` to `.planning/` (GSD's planning folder) on 2026-10-10; Phase 2 decision 38 had kept them in `docs/`. The README links now point here. GSD's own files (PROJECT, REQUIREMENTS, ROADMAP, STATE) are generated from these plans with `/gsd-ingest-docs` once you approve it.
- `CONCEPT_PLAN.md` still says "DRAFT, awaiting approval", although Phases 1 and 2 were built from it. I'll mark it approved together with this plan, unless you say otherwise.

---

## 1. What Phase 3 delivers

At the end of Phase 3, **anyone can browse open jobs, read a job's details and see its employer's page without logging in**, and **job seekers can tell OpenDoor what they need once and see every open job ranked by how many of those needs it meets**, with the ones it doesn't meet named.

### Phase 3A: Public job board
- **Browse jobs:** search by words; filter by category, work setup, employment type and accommodations provided; sort; move through pages. The filters stay in the address, so Back works and a shared link shows the same results. The number of jobs found is read out when it changes.
- **Job page:** the 2B posting layout (accommodations first) for every open job.
- **Employer page:** the company or individual employer and their open jobs.
- **More demo data**, so the list has two pages and matching has something to show.

### Phase 3B: Needs and matching
- **My accommodation needs:** the job seeker ticks what they need, from the same list employers use.
- **My profile:** a short "about you" that employers will read in Phase 4 when the person applies, plus an optional, private disability type.
- **Find jobs** in the candidate portal: the same list, ranked by needs met, with every job saying, for example, "Meets 3 of your 5 needs" and "Not listed: Sign language interpreter".
- **How this job fits your needs** on the job page: every need, and whether this job meets it.
- **Candidate dashboard** with real content instead of "coming soon" tiles.

---

## 2. How we'll know it's done

### Phase 3A demo

| # | Demo step | Expected result |
|---|---|---|
| J1 | As a guest, open **Browse jobs** from the header | Only open jobs are listed, newest first, with the number found ("15 jobs"). Drafts and postings that are waiting, rejected, closed, past their closing date or deleted never appear |
| J2 | Search "developer", tick work setup **Remote** and the accommodation **Screen reader software provided** | The list narrows and the new count is read out. The address holds the filters; Back returns to the previous results; the same address in a new tab shows the same list |
| J3 | Go to page 2 | The page number is in the address; focus moves to the results heading |
| J4 | Open a job, then type a draft's address | The job page shows the accommodations first, then "At a glance" and the description, and links to the employer. The draft's address says the job isn't open, with a link back to Browse jobs |
| J5 | Open the employer's page | Company details, Verified badge and open jobs; no registration number, team members or email addresses |
| J6 | J1–J5 using only the keyboard, at phone width (360 px) | Everything works, with no sideways scrolling |

### Phase 3B demo

| # | Demo step | Expected result |
|---|---|---|
| C1 | Register as a new job seeker | The dashboard's main action is **Tell us what you need** |
| C2 | Tick 5 needs, save, open **Find jobs** | Jobs are ranked by needs met: "Meets all 5 of your needs" first, then partial matches with what's not listed, and jobs that meet none at the end |
| C3 | Tick **Only jobs that meet all my needs** | Only full matches remain |
| C4 | Open a partly matching job | **How this job fits your needs** marks each need as Provided or Not listed (and, if question 6 is approved, "Not needed: this job is remote") |
| C5 | Fill in My profile and choose a disability type; then log in as the employer and as the admin | Neither can see the job seeker's needs, profile or disability type anywhere (also covered by server tests) |
| C6 | The admin retires one of the job seeker's needs | My needs shows it as "no longer offered"; Find jobs now counts 4 needs |
| C7 | C1–C4 using only the keyboard at 360 px, and with a screen reader | Counts and changes are read out; nothing needs a mouse |

---

## 3. Decisions

### 3.1 Questions only you can answer

**1. Going online.** The code is on GitHub now, but the site isn't deployed: there's no Railway setup and no Cloudflare deploy. Should we deploy before 3A, during Phase 3, or keep postponing?
- *My recommendation:* make deployment **step 0 of Phase 3** if the domain is ready, so the public job board is the first thing online. Cloudflare builds from a GitHub branch, so the app should be on `main` first. I need the domain name, who owns the Cloudflare and Railway accounts, and an OK for Railway's cost (about US$5 a month).
- *Why:* Phase 7's usability tests must run on the live site, and the concept plan's rule was to deploy early so the last week holds no surprises.

**2. Dates.** When are the usability tests (SUS, with 5+ PWD and 3+ employer participants) and the defense?
- *My recommendation:* none. I need the dates to judge whether Phase 3 should be trimmed (concept §6, "priority guard") and when deployment must be done.

**3. The proposal papers.** Can you add the *Modules and Features Specification* (at least M2 and M5) and the *Revised Proposal* to `.planning/`?
- *My recommendation:* yes. I'll then check every M2 and M5 feature number against this plan before building. Without them, this plan follows the concept plan's summary.

**4. Profile fields.** What should **My profile** hold?
- *My recommendation:* city or municipality; contact number; about me; skills (free text); highest education (Elementary, High school, Alternative Learning System (ALS), Vocational or TESDA course, Some college, College graduate, Postgraduate); work experience (free text). **All optional in Phase 3**; Phase 4 decides what's required before applying. No résumé file yet (Phase 7, stored on R2).
- *Why:* matching only uses the needs. The profile is what employers read when someone applies, so short and plain beats long and structured.

**5. Disability type.** Include the optional, private disability type now (concept M2 and D9)?
- *My recommendation:* yes. Optional, more than one allowed, from the categories on the PWD ID: Deaf or hard of hearing, Intellectual, Learning, Mental, Physical (orthopedic), Psychosocial, Speech and language, Visual, Cancer, Rare disease. **Please check this list against the current NCDA form.** It's never used for matching or filters and never shown publicly. From Phase 4 it reaches only employers the person applies to, and only if they tick "Show my disability type to employers I apply to" (off by default). The draft privacy notice gets a paragraph about it, because disability is sensitive personal information under the Data Privacy Act.
- *Why:* it matches the proposal's data model (`show_disability`) and keeps the concept's rule: *match on needs, not diagnosis*.

**6. Work setup and matching (this matters for the defense).** A posting's work setup (On-site, Hybrid, Remote) and its accommodations are separate fields. Counting only the accommodations an employer ticked gives odd results:
- a remote job that didn't tick "Remote work" shows "Remote work" as not listed;
- a wheelchair user sees a remote job as not listing "Wheelchair-accessible entrance" and ranked low, although they would work from home.

The options:
- **(a)** count only what the employer lists (the concept plan as written);
- **(b) the work setup counts too:** a Remote job meets the "Remote work" need, a Hybrid job meets the "Hybrid work" need, and on a Remote job the needs that only matter at the workplace (the four Physical access types, Transportation assistance and Service animal allowed) count as met, shown as "Not needed: this job is remote";
- **(c)** employers must tick "Remote work" for remote jobs (this fixes only the first problem).

- *My recommendation:* **(b)**. The admin decides which types only matter at the workplace (a new checkbox on each accommodation type; the seeder ticks the six above). The two work-setup links use a fixed key, so renaming "Remote work" doesn't break them. The example in §4.3 shows the difference for a wheelchair user.
- *Why:* a match should say whether the job works for the person. The job page shows why each need counts, so nothing is hidden. These derived matches are never treated as the employer's promises: Phase 5 feedback rates only what the employer listed.

**7. Which workflow builds Phase 3?** Phase 2B was planned and built with Superpowers (a written plan, then subagent-driven development) and reviewed with GSD agents. Now that `.planning/` exists, GSD can also track the roadmap and progress.
- *My recommendation:* keep what worked. Superpowers writes the step-by-step plan and builds it; GSD keeps the roadmap and progress (ROADMAP, STATE) current and runs the checks (code review, UI review, security audit, verify-work).
- *Why:* one proven way of building, plus GSD's tracking and reviews, without two competing plans for the same work.

### 3.2 Design decisions (my recommendation stands unless you object)

**Shape of the phase**

| # | Question | My recommendation | Why |
|---|---|---|---|
| 8 | Split Phase 3 into **3A (public job board)** and **3B (needs and matching)**, with a check-in after 3A? | **Yes, 3A first** | Find jobs (3B) is the 3A list plus matching. You can try the public board before matching is built on top of it |

**Pages and the server**

| # | Question | My recommendation | Why |
|---|---|---|---|
| 9 | The same pages for guests and job seekers? | **One set of pages, shown in two places:** public `/jobs`, `/jobs/:id` and `/employers/:id`, and the same pages inside the candidate portal (`/candidate/jobs`, `/candidate/jobs/:id`, `/candidate/employers/:id`). Match details appear only for a logged-in job seeker | Job seekers never leave their portal menu (concept principle 3, "Predictable"); guests get links they can share; one set of components to build and test. The alternatives were public pages only (job seekers would lose their menu) or separate pages per audience (twice the work) |
| 10 | One server address for both? | **Yes:** `GET /api/job-postings`, kept free for this by Phase 2 decision 35, answers everyone and adds the match details only when the caller is a logged-in job seeker | One query and one set of filters; a job seeker's needs come from their session and never appear in an address |

**Needs**

| # | Question | My recommendation | Why |
|---|---|---|---|
| 11 | Where do job seekers set their needs? | **A page of its own, "My accommodation needs"** (menu: "My needs"), with one Save button. Until needs are saved, it's the dashboard's main action. Not a step inside registration | One task per screen; keeps Phase 1's register → dashboard flow and its tests |
| 12 | A note on each need, like employers' notes? | **No** | Needs are for matching. Details for a particular job belong in the application (Phase 4's interview accommodation request) |
| 13 | Who sees a job seeker's needs? | **Only the job seeker.** From Phase 4, also the employers they apply to, through the application (concept §5.3) | Personal, health-related information |
| 14 | A need whose type the admin retires | **Stays on the job seeker's list as "no longer offered", is left out of "Meets X of Y", and can be removed but not added again** | The same rule as Phase 2 decision 31 for postings |
| 15 | A job seeker with no needs | **Find jobs works like Browse jobs (newest first)**, with one line: "Add your accommodation needs to see how well each job fits you." | Nothing breaks, and there's no nagging |

**Matching**

| # | Question | My recommendation | Why |
|---|---|---|---|
| 16 | How jobs are ranked | **Most needs met first, then the most recently approved, then by title.** Jobs that meet none still appear, at the end | The concept's demo shows full, partial and zero matches. Hiding jobs would make a job seeker think there are none |
| 17 | How a match is worded | "Meets all 5 of your needs"; "Meets 3 of your 5 needs" with "Not listed: Sign language interpreter, Accessible parking" on the next line (two names, then "and 2 more"); "Meets none of your 5 needs". **Never a percentage, a score, a ring or color alone.** "Not listed" uses a plain open-circle icon in muted text, not red | Plain language (concept principle 4). The concept wrote "Meets 4 of 5 of your needs"; "of your 5 needs" reads more naturally. A need that isn't listed isn't the person's mistake, and red is kept for statuses |
| 18 | "Only jobs that meet all my needs" | **A checkbox in Find jobs, off by default** | Many job seekers can only take a job that meets every need. It's the same count, so it costs little |
| 19 | Sort options | **Best match** (the default when you have needs), **Newest** (the default otherwise), **Closing soon** | Covers "what fits me", "what's new" and "what's urgent" |

**Search and filters**

| # | Question | My recommendation | Why |
|---|---|---|---|
| 20 | How search works | **Each word must appear somewhere in the title, description, location, category or employer name** (a "contains" search), up to 100 characters, instead of the concept plan's full-text index | Our server tests run on SQLite, which doesn't have MySQL's full-text search. At OpenDoor's size a "contains" search is fast enough, and it finds part-words ("develop" finds "developer"), which full-text search doesn't |
| 21 | Which filters | **Category** (one); **Work setup** (any of three); **Employment type** (any of four); **Accommodations provided** (the job must provide every one ticked; the same grouped checklist, without notes); for job seekers, decision 18. No location filter | Location is free text (Phase 2 decision 30), so search words cover it; remote jobs say "Anywhere in the Philippines" |
| 22 | When the results change | **Ticking a filter or changing the sort updates the list at once, without moving focus, and the new count is read out** ("12 jobs found"). Search words apply when you press **Search** or Enter, not on every key. On phones, the filters sit in one **Filters** section above the list that opens in place and says how many are on | The concept's "live result count", without a screen reader announcing every key press, and no pop-over that traps focus |
| 23 | Pages | **12 jobs per page;** numbered pages with Previous and Next; the page number in the address; changing a filter goes back to page 1; after changing page, focus moves to the results heading. No endless scrolling | Keyboard and screen reader users keep their place, and every page has a link |

**Public pages**

| # | Question | My recommendation | Why |
|---|---|---|---|
| 24 | A job that isn't open, at a public address | **Drafts, waiting, rejected, closed, past-date and deleted postings all answer "not found":** "This job isn't open. It may have closed or been removed." with a link to Browse jobs | An unpublished posting is never revealed. In Phase 4, applicants reach the jobs they applied to through their applications |
| 25 | What the employer page shows | **Company:** logo, name, Verified badge, industry, address, about, open jobs. **Individual employer:** name, "Individual employer", city or municipality, about, open jobs. **Never** the registration number, verification details, team members or email addresses | The Phase 2 forms already present these fields as public ("Name job seekers will see", "Shown to job seekers") |
| 26 | Which employers have a public page | **Those with at least one posting, not deleted, that an admin has approved at some point** (even if it has closed since). Others answer "not found" | Someone who only set up a profile hasn't chosen to be public yet. The page stays when their jobs close, ready for Phase 5's trust score |

**Demo data, leftovers and checks**

| # | Question | My recommendation | Why |
|---|---|---|---|
| 27 | Demo data | **Two more demo companies** (one verified, one waiting) and **about 11 more open postings**, for about 15 open jobs (two pages) across most categories, all five accommodation groups and every work setup, plus one closed and one past-date posting that must not appear. **`candidate@opendoor.test`** gets a short profile and the five needs of a wheelchair user: Wheelchair-accessible entrance, Accessible restroom, Elevator or ground-floor workspace, Adjustable workstation, Flexible hours. The postings are chosen so the list shows full, partial and zero matches. A second job seeker, **`candidate2@opendoor.test`**, needs Sign language interpreter, Written or captioned meetings and Flexible hours, so the same jobs rank differently. Everything is added only for accounts and employers that don't have it yet | Concept §8's demo story. Showing two people with different needs ranking the same jobs differently is the clearest demo of differentiator 1. Seeders never change existing data |
| 28 | Leftovers from Phase 2B | **See the table below** | |
| 29 | Checks before finishing | **As Phase 2 decision 38, now with GSD set up:** Superpowers code review and verification; GSD code review, UI review and security audit of the changed files; GSD verify-work for the demo steps; a browser walk-through on the separate `opendoor_verify` database; **a groupmate runs NVDA on Windows through Find jobs** | Two independent reviews. The screen reader pass catches what automatic checks can't, such as announcements and reading order |

**Decision 28: Phase 2B leftovers**

| Left for later in 2B | Fix in Phase 3? | Why |
|---|---|---|
| The JavaScript bundle is 540 kB (Vite warns above 500 kB) | **Yes:** each page's code loads when the page is opened | Phase 3 adds about eight pages |
| Lists show at most 200 rows and don't say so | **Yes:** the employer Job postings list and admin Posting approvals use the new page numbers | The page-number building block exists after 3A |
| Team: every "Create invite link" button has the same name for screen readers, and two invites made the same day share a "Revoke" name | **Yes** | Two small fixes |
| The demo postings find categories and accommodation types by name | **Yes, in the new demo data:** a demo posting whose category or type is missing is skipped with a message | The new seeders follow the same pattern |
| More permission tests (another company saving or changing a status; an admin opening a deleted posting) and accessibility checks on the posting pages | **Yes** | Phase 4 builds on postings |
| An HR officer moved to another department sees the old name until the page reloads | No | Rare, and a reload fixes it |
| Rare cases (an accommodation error shown on the wrong item; an unknown status shown as Draft; Close refused when a date is sent with it) | No | Rare and harmless |
| The high-contrast theme's red buttons need dark text | No: with the display settings (Phase 7) | The theme can't be switched on yet |

---

## 4. What gets built

### 4.1 Database changes

| Table | What it holds | Part |
|---|---|---|
| `candidate_profiles` (new) | One per job seeker: city or municipality, contact number, about me, skills, highest education, work experience, disability types (optional, private) and **show my disability type to employers I apply to** (off by default) | 3B |
| `candidate_accommodation` (new) | The job seeker's needs: which accommodation types | 3B |
| `accommodations` (changed, if question 6 is approved) | **Only matters at the workplace** (yes or no), and a fixed **work setup link** (remote or hybrid) on "Remote work" and "Hybrid work" | 3B |
| `job_postings` (index only) | An index on status and closing date for the public list | 3A |

### 4.2 Who can see what

| Information | The job seeker | Guests and other job seekers | Employers | Admins |
|---|---|---|---|---|
| Open jobs and public employer pages | ✓ | ✓ | ✓ | ✓ |
| Their needs | ✓ (can change) | — | — (Phase 4: through an application) | — |
| Their profile | ✓ (can change) | — | — (Phase 4: applicants only) | — (Phase 6 decides) |
| Their disability type | ✓ (can change) | — | — (Phase 4: only if they allow it, applicants only) | — |
| "Meets X of your Y needs" | ✓ | — | — | — |

Every rule is checked by the server. Hiding something in React is only for convenience.

### 4.3 How matching works

1. **Open jobs** are postings with status Open, a closing date of today or later (Philippine time), and not deleted.
2. **The job seeker's needs** are their accommodation types that are still offered (decision 14).
3. **A need is met** when the posting lists that accommodation. If question 6 is approved, the work setup also counts: a Remote job meets "Remote work" and every need that only matters at the workplace; a Hybrid job meets "Hybrid work".
4. **Best match** order: most needs met, then most recently approved, then title.
5. The list shows needs met, total needs and up to two needs that aren't listed; the job page shows every need and why it counts.

**Example:** the demo wheelchair user (decision 27) and today's three open demo jobs.

| Job | Work setup | (a) Listed accommodations only | (b) Work setup counts too (recommended) |
|---|---|---|---|
| HR Assistant | On-site | Meets 3 of your 5 needs. Not listed: Elevator or ground-floor workspace, Adjustable workstation | The same: an on-site job gets no work-setup matches |
| Junior Web Developer | Remote | Meets 1 of your 5 needs. Not listed: Wheelchair-accessible entrance, Accessible restroom and 2 more | Meets 4 of your 5 needs. Not listed: Adjustable workstation. The entrance, restroom and elevator are "Not needed: this job is remote" |
| Part-time Home-based Bookkeeper | Remote | Meets 1 of your 5 needs. Not listed: Wheelchair-accessible entrance, Accessible restroom and 2 more | Meets 4 of your 5 needs. Not listed: Adjustable workstation |

With (a), both remote jobs rank below the on-site one for someone who can't easily get to an office. With (b), they rank above it.

### 4.4 Pages

**Public** (the header gains **Browse jobs**):

| Page | What's on it | Part |
|---|---|---|
| Browse jobs (`/jobs`) | Title and one-line intro; search box with **Search**; filters (a left column on wide screens, a **Filters** section on phones); sort; "15 jobs"; the list; page numbers. Guests see one quiet line: "Have accommodation needs? Register as a job seeker to see how well each job fits you." | 3A |
| Job page (`/jobs/:id`) | The 2B job layout: title, employer with badge (links to the employer page), department, the accommodations panel, "At a glance", "About the job" | 3A |
| Employer page (`/employers/:id`) | Decision 25, then the employer's open jobs in the same list | 3A |
| Home (updated) | A search box that opens Browse jobs | 3A |

**Candidate portal** (menu: Dashboard · Find jobs · My needs · My profile):

| Page | What's on it | Part |
|---|---|---|
| Dashboard (updated) | Without needs: one main action, **Tell us what you need**. With needs: "Your accommodation needs: 5" with **Change my needs**; "3 open jobs meet all your needs" with the best three; a prompt to fill in My profile while it's empty | 3B |
| Find jobs (`/candidate/jobs`) | Browse jobs, plus the match line on every job, the **Best match** sort and decision 18 | 3B |
| Job page (`/candidate/jobs/:id`) | The job page, plus **How this job fits your needs** above the accommodations panel | 3B |
| Employer page (`/candidate/employers/:id`) | The public employer page, inside the portal | 3B |
| My accommodation needs (`/candidate/needs`) | A short intro saying who sees the list; the grouped checklist without notes; **Save my needs** | 3B |
| My profile (`/candidate/profile`) | About you (question 4); a **Private** section with the disability type and the "show to employers I apply to" checkbox, explaining who sees it; **Save profile** | 3B |

### 4.5 New building blocks

| Building block | What it does for users | Part |
|---|---|---|
| Job list and job row | Ruled rows: the title as a link; the employer with its badge; the key facts as labelled pairs ("Work setup: Remote"); what the job provides ("Provides Wheelchair-accessible entrance, Flexible hours and 2 more") | 3A |
| Search and filters | A labelled search box with a **Search** button; each filter group a fieldset with a legend; **Clear all filters** | 3A |
| Filters section (phones) | A button that opens and closes the filters in place and says how many are on ("Filters, 2 on") | 3A |
| Result count | The results heading ("15 jobs", "1 job", "No jobs"), plus the spoken count after a change | 3A |
| Page numbers | Previous, the page numbers, Next; the current page marked for screen readers; 44 px targets | 3A |
| Filters kept in the address | Every filter, the sort and the page live in the address; Back undoes the last change; the latest request wins (a 2B lesson) | 3A |
| Match line | "Meets 3 of your 5 needs" with its icon, then "Not listed: …" | 3B |
| Fit panel | Every need, marked Provided (with the employer's note, if any), Not needed (remote job) or Not listed | 3B |
| Accommodation picker (reused from 2B) | Without notes, for needs and for the filter | 3A, 3B |

### 4.6 Tests

**Phase 3A server tests:**
- Only postings that are open, not past their closing date (in Philippine time, including between midnight and 8 a.m. when the UTC date is a day behind) and not deleted are listed or shown. Drafts and postings that are waiting, rejected, closed or deleted answer "not found" on the job page.
- Search: every word must match the title, description, location, category or employer name; `%` and `_` are searched as ordinary characters; over-long searches are refused.
- Filters: category; work setups (any of those ticked); employment types (any); accommodations (all of those ticked); malformed values are refused.
- Sorting by newest and closing soon; pages of 12 with totals; a page past the end is empty, not an error.
- The public posting shape has no actions, author, rejection reason, approval dates or verification details.
- Employer page: only for employers with an approved posting that isn't deleted; no registration details, team members or email addresses; only its open jobs.
- The public list is rate-limited, and the number of database queries doesn't grow with the number of jobs on a page.

**Phase 3B server tests:**
- Profile: only the job seeker reads and changes their own; guests, employers and admins are refused; fields are checked; disability types come only from the list.
- Needs: saved and replaced; unknown types are refused, and so are retired types newly added; a retired need already saved stays, but isn't counted.
- Matching: needs met, total and the names not listed are right; the work-setup rule (if question 6 is approved); Best match order; "only jobs that meet all my needs"; a job seeker with no needs gets the plain list.
- Privacy: match details, needs, profile and disability type never appear in what guests, other job seekers, employers or admins receive.
- Seeding twice changes nothing.

**Page tests (both parts):** filters are written to the address and Back restores them; changing a filter returns to page 1; the latest request wins; the count is read out after a change; focus moves to the results heading after a page change; the match line and fit panel wording for all, some, none and a single need; the Filters section reports how many are on; page numbers mark the current page; saving needs works; retired needs show "no longer offered"; automatic accessibility checks pass on every new page.

### 4.7 Look and feel (Frontend Design pass)

**The brief.** Phase 3's screens are where a job seeker decides whether a job is possible for them at all. The approved direction from Phase 2 (§4.10 there) stays: purple for actions, amber only for accommodation promises, Atkinson Hyperlegible, ruled rows rather than cards, left-aligned, one motion. Phase 3 adds one new idea and spends its boldness there.

**The one bold element: the fit line.** On every job in Find jobs, right under the title and employer: **"Meets 3 of your 5 needs"** in bold ink with an amber check, then "Not listed: Elevator or ground-floor workspace, Adjustable workstation" in muted text with an open circle. On the job page it grows into **How this job fits your needs**, a checklist with an ink rule on its left, sitting directly above the amber "Accommodations provided" panel. The ink rule means "your needs" and the amber rule means "the employer's promises", so the two panels read as a pair without a new color.

**Tokens (unchanged, with Phase 3 usage rules):**

| Token | Hex | Phase 3 use |
|---|---|---|
| Ink | `#1c1a24` | Text, the match count, the fit panel's rule |
| Muted ink | `#4d4a5c` | "Not listed" lines, hints, the facts in job rows |
| Lavender page | `#f8f7fb` | Page background |
| White surface | `#ffffff` | The header, the filters section on phones |
| Purple | `#5b21b6` | Job titles (links), buttons, the current page number |
| Amber | `#a54a06` | Accommodations a job provides, and checks on needs it meets. Nothing else |

Green and red remain for statuses only, always with an icon and text. **No new colors.**

**Type:** Atkinson Hyperlegible only. Page titles 34–42 px; "15 jobs" 26 px; job titles in the list 21 px; body, match line and facts 17 px; descriptions kept under about 70 characters a line.

**Layout, wide screens (1024 px and up):** filters in a left column of about 18rem, results on the right.

```
Find jobs
Jobs ranked by how many of your 5 needs they meet.   Change my needs

[ Job title, skill, company or place                  ]  [ Search ]

Filters                          15 jobs                    Sort by [ Best match  v ]
                                 ------------------------------------------------------
[ ] Only jobs that meet          Junior Web Developer
    all my needs                 OpenDoor Demo Corp.    (check) Verified company
                                 (check) Meets 4 of your 5 needs
Category                         (o) Not listed: Adjustable workstation
[ Any category        v ]        Work setup: Remote   Employment type: Full-time
                                 Apply by: November 9, 2026
Work setup                       ------------------------------------------------------
[ ] On-site                      HR Assistant
[ ] Hybrid                       OpenDoor Demo Corp.    (check) Verified company
[ ] Remote                       (check) Meets 3 of your 5 needs
                                 (o) Not listed: Elevator or ground-floor workspace,
Employment type                      Adjustable workstation
[ ] Full-time                    Work setup: On-site   Employment type: Full-time
[ ] Part-time ...                Location: Makati City, Metro Manila
                                 Apply by: November 24, 2026
Accommodations provided          ------------------------------------------------------
Physical access
[ ] Wheelchair-accessible ...    Previous   1   2   Next
...
[ Clear all filters ]
```

**Layout, phones (360 px):** one column. The search box, then the **Filters** section (closed, "Filters, 1 on"), then sort, then the count and the list. Each fact gets its own line, so nothing scrolls sideways.

```
Find jobs
Jobs ranked by how many of
your 5 needs they meet.
Change my needs

Search jobs
[ Job title, skill, company... ]
[ Search ]

[ Filters, 1 on             v ]
Sort by [ Best match        v ]

15 jobs
--------------------------------
Junior Web Developer
OpenDoor Demo Corp.
(check) Verified company
(check) Meets 4 of your 5 needs
(o) Not listed: Adjustable
    workstation
Work setup: Remote
Employment type: Full-time
Apply by: November 9, 2026
--------------------------------
```

**Job page for a job seeker (wide):** the 2B layout, with the fit panel at the top of the right column (shown with question 6's option b).

```
Junior Web Developer                                  (Open)
OpenDoor Demo Corp.   (check) Verified company
Department: IT

About the job                          | How this job fits your needs      <- ink rule
Build and maintain accessible web      | Meets 4 of your 5 needs
pages for our clients ...              | (check) Wheelchair-accessible entrance
                                       |         Not needed: this job is remote
                                       | (check) Flexible hours
                                       |         Provided
                                       | (o)     Adjustable workstation
                                       |         Not listed. You can ask the
                                       |         employer about it.
                                       |
                                       | Accommodations provided          <- amber rule (2B)
                                       | At a glance
```

**My accommodation needs:** the 2B picker without note fields. The intro says what the list does and who sees it: "Tick what you need at work. Find jobs ranks jobs by how many of these they provide. Employers see this list only when you apply to one of their jobs." One **Save my needs** button at the end.

**Checked against generic job-board defaults** (the Frontend Design review step: where a first idea was the default every job board uses, it was replaced):

| The generic default | Our choice | Why |
|---|---|---|
| A grid of identical job cards with logos, tag chips and a bookmark icon | Ruled rows; logos only on the job and employer pages | Phase 2's "fewer boxes" rule; rows scan more easily under a screen magnifier |
| A "92% match" ring or bar | A sentence: "Meets 4 of your 5 needs", then what's not listed | Concept principle 4; a percentage hides *which* need isn't met |
| A red ✕ for missing items | A muted open circle and "Not listed" | It isn't the person's error, and red is kept for statuses |
| Colored chips for accommodations | Plain words after an amber check | Chips would add a third color system; amber already means "promise" |
| Search as you type with instant results | A Search button; filters update at once with a spoken count | Screen readers don't chatter on every key, and focus never jumps |
| Endless scrolling or "Load more" | Numbered pages kept in the address | Keyboard and screen reader users keep their place; every page has a link |
| A sticky sidebar on desktop and a sliding sheet on phones | A left column on wide screens; one Filters section that opens in place on phones | No overlay to trap focus; works at 200% zoom |

**Words on the screen:**

| Where | Text |
|---|---|
| Browse jobs intro | "Find open jobs and see which accommodations each one provides." |
| Find jobs intro | With needs: "Jobs ranked by how many of your 5 needs they meet." and the link **Change my needs**. Without: "Add your accommodation needs to see how well each job fits you." and **Add my needs** |
| Count | "15 jobs", "1 job", "No jobs"; read out as "15 jobs found" |
| No results | "No jobs match these filters. Try fewer filters or different words." and **Clear all filters** |
| Couldn't load | "We couldn't load the jobs. Check your connection and try again." and **Try again** |
| Job not open | "This job isn't open. It may have closed or been removed." and **Browse open jobs** |
| Match line | "Meets all 5 of your needs", "Meets 3 of your 5 needs", "Meets none of your 5 needs"; with one need: "Meets your need" or "Doesn't meet your need"; then "Not listed: A, B and 2 more" |
| Fit panel | "Provided"; "This job is remote" (or hybrid); "Not needed: this job is remote"; "Not listed. You can ask the employer about it." |
| Saved | "Your needs are saved. Find jobs now ranks jobs by them." and "Your profile is saved." |
| Disability type hint | "Optional. OpenDoor never uses this to match or filter jobs. Employers see it only if you tick the box below and apply to one of their jobs." |

**Accessibility details:**
- Each job row is a list item with its title as a heading and link. The match line is ordinary text in the reading order, so screen readers read it right after the title and employer.
- Every icon sits next to text that says the same thing. Nothing relies on color.
- The results heading takes focus after a page change. Filter changes keep focus where it is and announce the count through the existing announcer.
- The Filters button on phones reports open or closed, and how many filters are on.
- Checkboxes keep the 44 px click area from 2B. No new motion; the Filters section opens without animation.
- Checked at 360 px and at 200% zoom, with no sideways scrolling.

### 4.8 Privacy and security checks

These are verified by the security review at the end of each part.

| Risk | How it's handled | Part |
|---|---|---|
| Unpublished postings reachable through the public server addresses | One "open job" rule used by the list, the job page and the employer page; anything else answers "not found" | 3A |
| An employer's registration or verification details leaked | Separate public shapes for postings and employers that list only the public fields | 3A |
| Search abuse: wildcard characters, very long text, many words | `%`, `_` and `\` searched as ordinary characters; 100 characters and 8 words at most; 120 requests a minute per IP address | 3A |
| Crafted filter values (lists, unknown numbers, page 99999) | Every filter is checked; unknown categories and types are refused; a page past the end is empty | 3A |
| Listing the pages of employers who never published a job | Decision 26 | 3A |
| A job seeker's needs, profile or disability type leaked | Read only from the logged-in job seeker's session, never from the address; tests for what every other role receives | 3B |
| A profile changed through hidden fields | Only the listed fields can be saved; the owner comes from the session | 3B |
| A retired type added to needs through a hand-made request | The same check the posting form uses (Phase 2 threat model) | 3B |

---

## 5. Order of work

**Phase 3A: Public job board**

| Step | Work | Done when |
|---|---|---|
| 0 | *(If question 1 is yes)* Railway service, MySQL and Dockerfile; Cloudflare DNS, a Workers build from the GitHub repository, and `api.<domain>` | `https://<domain>` loads and its health check reaches `https://api.<domain>` |
| 1 | Server: the open-job rule, search, filters, sort and pages; public posting and employer shapes; server addresses; demo data | 3A server tests pass |
| 2 | Building blocks: job list, search and filters, Filters section, result count, page numbers, filters kept in the address; each page's code loaded separately | Page tests pass; no bundle-size warning |
| 3 | Browse jobs, Job page and Employer page; header and Home links | Demo steps J1–J5 work |
| 4 | Checks (decision 29); keyboard and phone-width pass (J6); README; commit | **Check-in with you before 3B** |

**Phase 3B: Needs and matching**

| Step | Work | Done when |
|---|---|---|
| 5 | Candidate tables, permission rules and server addresses; accommodation type changes (question 6); demo job seekers | Server tests pass |
| 6 | Matching in the job list and the job page | Matching tests pass |
| 7 | My needs, My profile, Find jobs, the candidate job and employer pages, fit panel, dashboard; privacy notice paragraph | Demo steps C1–C6 work |
| 8 | Phase 2B leftovers (decision 28) | Their tests pass |
| 9 | Checks; keyboard, phone-width and screen reader pass (C7); README; build notes in this file; commit | Phase 3 finished |

**How the workflows fit (if question 7 is approved):**
1. You answer §3, and I mark this plan approved.
2. `/gsd-ingest-docs` creates GSD's PROJECT, REQUIREMENTS, ROADMAP and STATE from the approved plans.
3. Superpowers writes the step-by-step plan for 3A (in `.planning/superpowers/plans/`, like 2B's) and builds it with subagent-driven development.
4. GSD runs code review, UI review, the security audit and verify-work, and records progress in STATE. Then the same for 3B.

---

## 6. Not in Phase 3

| Feature | Comes in |
|---|---|
| Applying, application status, and applicants for employers (department-scoped) | Phase 4 |
| The interview accommodation request | Phase 4 |
| Employers seeing an applicant's profile, needs and (if allowed) disability type | Phase 4 |
| Trust score on job and employer pages | Phase 5 |
| Notifications, such as "New jobs that meet your needs" | Phase 6 |
| An admin view of job seekers (Users) | Phase 6 |
| Saved jobs, résumé upload, display settings (larger text, high contrast) | Phase 7 |
| Matching or recommendations by skills | Not planned: OpenDoor matches on needs |
| Location filter, distance or map search | Not planned: location is free text |
| Salary | Not planned (not in the proposal) |
| PWD ID number or proof of disability | Not planned (not in the proposal, and very sensitive) |

---

## 7. For groupmates: after pulling Phase 3

```bash
cd backend
composer install
php artisan migrate
php artisan db:seed
php artisan test
```

```bash
cd frontend
npm install
npm run test
```

`db:seed` adds the new demo companies, jobs and job seekers. It never changes an account or posting that already exists.

---

## Appendix: technical reference

### A. Server addresses (API endpoints)

**Phase 3A**

| Method | Address | Who | Purpose |
|---|---|---|---|
| GET | `/api/job-postings` | Anyone | Open jobs, 12 per page. Filters: `q`, `category`, `work_setup[]`, `employment_type[]`, `accommodations[]`, `employer`; `sort` (`newest`, `closing`); `page`; `per_page` (up to 12). Rate-limited |
| GET | `/api/job-postings/{posting}` | Anyone | One open job in the public shape; "not found" otherwise |
| GET | `/api/employers/{employer}` | Anyone | Public employer details (decisions 25 and 26). Its jobs come from `/api/job-postings?employer=` |

**Phase 3B**

| Method | Address | Who | Purpose |
|---|---|---|---|
| GET | `/api/job-postings` (extended) | Logged-in job seeker | Each job also has `match`: `needs_total`, `needs_met`, `not_listed` (names). Adds `sort=match` and `only=all_needs` |
| GET | `/api/job-postings/{posting}` (extended) | Logged-in job seeker | Also `fit`: every need with its state (`provided`, `work_setup`, `not_needed`, `not_listed`) and the employer's note |
| GET, PUT | `/api/candidate/profile` | Job seeker | Their own profile, including disability types and the "show to employers" setting |
| GET, PUT | `/api/candidate/needs` | Job seeker | Their own needs (`accommodation_ids`), each returned with `is_active` |
| PUT | `/api/admin/accommodations/{id}` (extended) | Admin | Also `on_site_only` (question 6) |

The public addresses read the session if there is one; no login is needed. A suspended account is treated as a guest.

### B. Main files

**Backend (`backend/`)**
- Migrations: `create_candidate_profiles_table`, `create_candidate_accommodation_table`, `add_matching_columns_to_accommodations_table` (question 6), an index on `job_postings`
- Enums: `EducationLevel`, `DisabilityType`
- Models: `CandidateProfile`; `User::candidateProfile()`; `JobPosting` scopes `publiclyVisible`, `search`, `providingAll`
- Services: `JobSearch` (filters, sort, pages) and `Matching` (needs met, not listed, fit states). Matching lives in one place, so the list, the job page and the dashboard always agree
- Requests: `JobSearchRequest`, `CandidateProfileRequest`, `CandidateNeedsRequest`
- Resources: `PublicJobPostingResource`, `PublicEmployerResource`, `CandidateProfileResource`
- Controllers: `Public\JobPostingController`, `Public\EmployerController`, `Candidate\ProfileController`, `Candidate\NeedsController`
- Seeders: `DemoEmployerSeeder` (two more companies), `DemoJobPostingSeeder` (more postings), `DemoCandidateSeeder` (two job seekers)

**Frontend (`frontend/src/`)**
- Pages: `portals/public/BrowseJobsPage`, `JobPage`, `EmployerPage`; `portals/candidate/FindJobsPage`, `NeedsPage`, `ProfilePage`; `CandidateDashboard` (updated)
- Components: `components/jobs/JobList`, `JobListItem`, `JobFilters`, `FiltersSection`, `ResultCount`, `MatchLine`, `FitPanel`; `components/ui/Pagination`
- Hooks and API: `hooks/useJobSearchParams`; `api/jobs.js`, `api/candidate.js`
- Router: pages loaded when opened (`React.lazy`); public and candidate routes; the candidate menu in `portalMenus.js`; **Browse jobs** in `PublicLayout`

### C. Things to get right (review focus)

1. **Philippine midnight versus UTC midnight.** From 00:00 to 08:00 Manila time, the UTC date is a day behind. Reuse `JobPosting::today()` for the open-job rule.
2. **SQLite in tests versus MariaDB and MySQL.** Filter on match counts with `whereHas(..., '>=', n)` or a `where` on the count expression, never `HAVING` without `GROUP BY`. Test search with plain ASCII, because MariaDB's collation ignores accents (José finds Jose) and SQLite's doesn't.
3. **One matching calculation.** The list, the job page, the dashboard and "only all needs" must give the same numbers; they all use the `Matching` service.
4. **Needs never leave the server** except in their owner's responses. Tests cover what guests, other job seekers, employers and admins receive.
5. **Address state.** Back and Forward restore results; a filter change resets the page to 1; the latest request wins.
6. **Pages loaded when opened, and focus.** In 2B, focus was lost when a loading state replaced the page heading. Lazy-loaded pages must keep focus on the new page's heading after loading.

A query sketch for the list (decision 16 and question 6):

```php
// The needs come from the logged-in job seeker's profile, never from the address.
JobPosting::publiclyVisible()                    // open, closes_on >= today in Manila, not deleted
    ->search($q)                                 // each word: title, description, location, category, employer
    ->inCategory($category)
    ->withWorkSetups($setups)->withEmploymentTypes($types)
    ->providingAll($accommodationIds)            // whereHas(..., '>=', count), no HAVING
    ->when($needs, fn ($query) => $matching->addNeedsMet($query, $needs))
    // needs_met = listed needs + (remote: workplace-only and "Remote work" needs not listed)
    //                          + (hybrid: "Hybrid work" if not listed)
    ->orderByDesc('needs_met')->orderByDesc('approved_at')->orderBy('title')
    ->paginate(12);
```
