# Phase 3 Plan: Candidate Side

> Status: **DRAFT v2, four questions left (§3).** Updated 2026-10-10 after reading the proposal papers ([Revised Proposal](papers/REVISED_PROPOSAL.md), [Modules and Features](papers/MODULES_AND_FEATURES.md)). Nothing in this plan is built yet.
> Part of: [CONCEPT_PLAN.md](CONCEPT_PLAN.md), build phase 3 of 7
> Builds on: [PHASE_2_PLAN.md](PHASE_2_PLAN.md) (employers, departments and job postings with structured accommodations)
> Method: Superpowers brainstorming (this spec, for your review), GSD (state check, `.planning/` setup), Frontend Design (§7).

---

## 0. Where we are

**Built (Phases 1, 2A, 2B):** accounts and roles, categories and accommodation types, companies with departments, HR invites and verification, individual employers, and job postings with accommodations and admin approval. 159 server tests and 124 page tests pass.

**What's next: Phase 3, the candidate side.** The papers' build order (Modules and Features §7) puts **M2 Candidate Profile** and **M5 Search, Filter and Matching** here. Phase 3 is done when "a candidate sees postings ranked by *Matches my needs*". This is OpenDoor's main differentiator and answers **SOP 1**.

**Time left.** The defense is around **October 21–25**, which is 11 to 15 days away. That's enough for the Must-haves if every day counts, so this plan includes a road map to the defense (§1). If you meant November, see question 4.

**Where the code is.** The app is on GitHub at [ryujiinnn08/opendoor](https://github.com/ryujiinnn08/opendoor), branch `feature/opendoor-web-app`. The repository's `main` branch holds your System Integration and Architecture Lab 05, so question 1 decides how the two share `main`. Nothing is deployed yet.

---

## 1. Road to the defense

| When (2026) | Work | Answers |
|---|---|---|
| Sat Oct 10 – Mon Oct 12 | **Phase 3:** profile, digital résumé, accommodation needs, search and matching, public job and employer pages | SOP 1 |
| Tue Oct 13 – Wed Oct 14 | **Phase 4:** apply (with interview accommodation request), track, withdraw, review, hire or reject, confirm hire | SOP 2 |
| Thu Oct 15 | **Phase 5:** feedback form, trust score, 3-response minimum, per-accommodation breakdown | SOP 3 |
| Fri Oct 16 | **Phase 6, Must-have parts:** user management (suspend, reactivate, create admins), posting removal, the three dashboards | SOP 4 |
| Mon Oct 12 – Fri Oct 16, alongside | **Deployment setup:** Railway (Laravel and MySQL), Cloudflare (domain, frontend, R2 file storage) | Objective 5 |
| Sat Oct 17 | **Go live:** deploy, seed demo data with a visible trust score, test on the live site | Objective 5 |
| Sat Oct 17 – Sun Oct 18 | **Accessibility audit and fixes:** axe, Lighthouse, keyboard, NVDA; the Phase 2B leftovers | SOP 5 |
| Mon Oct 19 – Tue Oct 20 | **Usability tests:** 5+ PWD and 3+ employer participants on the live site, with SUS | SOP 5 |
| Wed Oct 21 – Sun Oct 25 | **Defense** | |

**Start recruiting the usability-test participants now** (through a PDAO, PESO or PWD organization, as the proposal plans). Recruitment, not code, is what's most likely to slip.

**If we fall behind,** the papers' priorities decide what goes. The Could-haves stay out (saved jobs, display settings, forgot password, email notifications); the résumé is the exception, because you asked for it. Should-haves are cut in this order: admin analytics, report a posting, feedback moderation, in-app notifications, interview accommodation request, per-accommodation breakdown.

---

## 2. What Phase 3 delivers

### 3A: Public job board
- **Browse jobs** (`/jobs`): keyword search, category filter, accommodation filter, sort, 12 jobs per page, filters kept in the address, and the number of jobs found read out (F5.1–F5.3, F5.6, F5.7).
- **Job page** (`/jobs/:id`): the 2B posting layout, with accommodations and notes first.
- **Employer page** (`/employers/:id`): company details, Verified badge and open jobs (F3.5). The trust score is added in Phase 5.
- **Home:** a search bar and a few featured open jobs (Modules and Features §3.1).

### 3B: Profile, digital résumé and matching
- **My profile:** a job application profile (§4.1) plus a **digital résumé** (question 3) (F2.1, F2.4).
- **My needs:** the accommodation checklist (F2.2).
- **Private disability type**, hidden by default and never used for matching (F2.3).
- **Find jobs** (`/candidate/jobs`): **Matches my needs** is on by default, with full matches first and then partial matches by count. Each job says "Meets 4 of 5 of your needs" and names what's missing. A switch shows all jobs instead (F5.4, F5.5).
- **How this job fits your needs** on the job page.
- **Candidate dashboard:** top matches and a profile-completeness prompt (F8.1, F2.5).

---

## 3. Questions (four left)

Answer with the letter, or write your own answer.

### Q1. How should the app share GitHub's `main` with Lab 05?

GitHub's `main` holds Lab 05, and the app is on its own branch. Cloudflare will deploy from `main`, so the app needs to get there.

- **A (recommended).** Keep both. I join the lab's history into the app branch and move the lab into `labs/lab-05-microservices/`, so the app owns the top level. Then you merge the pull request into `develop` and `main`, like your earlier PRs. Nothing is lost.
- **B.** Keep both, with the lab staying at the top level next to the app.
- **C.** Replace `main` with the app, and keep the lab on `develop` and a `lab-05` tag. This rewrites `main`'s history.

### Q2. What do I need to deploy?

- The **domain name** the team owns.
- Who owns the **Cloudflare** and **Railway** accounts, or whether I should guide you through creating them.
- An OK for **Railway's cost** (a trial credit, then about US$5 a month).

*My recommendation:* set it up Mon Oct 12 to Fri Oct 16, while Phases 3–6 are built, and go live on Sat Oct 17 at the latest. The usability tests must run on the live site.

### Q3. What should the "digital résumé" be?

- **A (recommended). Both:** OpenDoor lays out your profile as a résumé page that you can print or save as PDF, and employers see the same page when you apply. You can also upload your own PDF résumé.
- **B.** Upload a PDF résumé only. This is what the papers call F2.4.
- **C.** The profile laid out as a résumé only, with no upload.

*Why A:* the built-in page is screen-reader friendly, which uploaded PDFs often aren't, and Phase 4 needs the same page for employers anyway. The upload covers people who already have a résumé.

### Q4. Is the defense October 21–25, and is the road map in §1 OK?

- **A (recommended).** Yes, October. Follow §1, and cut Should-haves in the listed order if we fall behind.
- **B.** It's in November. I'll keep the same order and add the Should-haves.

*Default for anything else:* Superpowers keeps writing the step-by-step plans and building; GSD tracks progress and runs the reviews. The two papers stay out of git for now because the repository is public; say "push the papers" if you want them there.

---

## 4. What's decided

### 4.1 The profile (your answer: "the basic premises of a job application profile")

| Section | What it holds |
|---|---|
| Basic information | Full name (from the account, can be corrected here), **headline** (e.g., "Bookkeeper with 3 years of experience"), **city or municipality and province**, contact number, email (from the account, shown read-only) |
| About me | A short summary in the person's own words |
| Work experience | Entries: job title, company or employer, started (month and year), ended or "I work here now", what you did. Up to 10 entries |
| Education | Entries: level (Elementary, Junior high school, Senior high school, Alternative Learning System, Vocational or TESDA, College, Postgraduate), school, course or strand, year finished or "Still studying". Up to 10 entries |
| Skills | A list, such as "Microsoft Excel, bookkeeping, customer service" |
| Trainings and certifications | One per line, such as "TESDA Bookkeeping NC III, 2024" |
| Languages | Such as "Filipino, English, Filipino Sign Language" |
| Résumé | Question 3: an optional PDF (up to 5 MB) and/or the profile shown as a printable résumé page |
| Private | Disability type (optional, one choice, hidden by default) and "Show my disability type to employers I apply to" (off) |

Every field is optional in Phase 3; Phase 4 decides what must be filled in before applying. The dashboard lists the sections still missing (F2.5): headline, location, contact number, education, skills and accommodation needs.

**Disability type choices** come from the PWD ID categories: Deaf or hard of hearing, Intellectual, Learning, Mental, Physical (orthopedic), Psychosocial, Speech and language, Visual, Cancer, Rare disease, plus "Prefer not to say". *Group to-do: check this list against the current NCDA form.*

### 4.2 Everything else

| Topic | Decision | Source |
|---|---|---|
| Needs | A grouped checklist without notes, on its own **My needs** page (menu: Dashboard · Find jobs · My needs · My profile). Until needs are saved, it's the dashboard's main action | F2.2; approved Oct 10 |
| Who sees needs and the profile | Only the job seeker. In Phase 4, employers see them through an application to their posting, and the disability type only if the person allows it | M2 rules; Revised Proposal §VII-H |
| Matching | **A need counts as met only when the posting lists that accommodation** | F5 rule; Revised Proposal §VII-F |
| Find jobs | Starts in **Matches my needs**: jobs that meet at least one need, full matches first, then by how many needs are met, then newest. **All jobs** shows every open job | F5.4; Revised Proposal §VII-B |
| Match badge | "Meets 4 of 5 of your needs" with "Missing: Sign language interpreter" under it (two names, then "and 2 more"). Never a percentage or color alone; "Missing" uses a muted icon, not red | F5.5; design (§7) |
| Guests, and job seekers without needs | See all open jobs, newest first, with filters | F5 rule |
| Search | Title, description, company name and location, as a "contains" search (not the full-text index the database section mentions: our tests run on SQLite, which doesn't have it) | F5.1; decision |
| When results change | Typing in search updates the list after a 300 ms pause (or at once on Enter); filters update at once; the new count is read out, such as "12 jobs found" | Revised Proposal §VIII; F13.2 |
| Filters | Keyword, category and accommodations (the job must provide every one ticked) | F5.2, F5.3 |
| Sort and pages | Best match, Newest, Closing soon; 12 per page; numbered pages; everything kept in the address so Back and shared links work | F5.6, F5.7 |
| Pages and server | The same pages publicly (`/jobs`, `/jobs/:id`, `/employers/:id`) and inside the candidate portal (`/candidate/jobs`, …); one `GET /api/job-postings` for everyone, with `match=1` for logged-in job seekers | Revised Proposal §IX; approved Oct 10 |
| A job that isn't open | Drafts and postings that are waiting, rejected, closed, past their date or deleted answer "This job isn't open. It may have closed or been removed." | Approved Oct 10 |
| Employer page | Company details, Verified badge and open jobs; never the registration number, team members or email addresses. Only for employers with at least one approved posting | F3.5; approved Oct 10 |
| Retired accommodation in someone's needs | Stays on their list as "no longer offered", isn't counted, and can be removed but not added again | Approved Oct 10 |
| Demo data | Two more demo companies (one verified, one waiting), about 11 more open postings (about 15 open, two pages), plus a closed and a past-date posting that must not appear. `candidate@opendoor.test` gets a profile and a wheelchair user's 5 needs; `candidate2@opendoor.test` is Deaf (Sign language interpreter, Written or captioned meetings, Flexible hours), so the same jobs rank differently | Concept §8; approved Oct 10 |
| Checks before finishing | Superpowers code review and verification; GSD code review, UI review and security audit; a browser walk-through; a groupmate runs NVDA on Windows through Find jobs | Approved Oct 10 |

### 4.3 What changed after reading the papers

| Before (draft v1) | Now | Why |
|---|---|---|
| Question 6: should a job's work setup count toward matching? | **No.** Matching counts only listed accommodations | The papers define the match count that way (F5 rule) |
| Decision 16: jobs that meet none appear at the end | **Matches my needs** shows jobs meeting at least one need; **All jobs** shows the rest | The papers' "Show all jobs" switch (F5.4) |
| Decision 17: "Meets 3 of your 5 needs", "Not listed:" | "Meets 4 of 5 of your needs", "Missing:" | The papers' wording (F5.5), which the panel has read |
| Decision 18: "Only jobs that meet all my needs" checkbox | Dropped | Full matches already come first, and it saves time |
| Decision 21: also filter by work setup and employment type | Dropped | Not in the papers; they can come back after the defense |
| Decision 22: search only on Enter | Also after a 300 ms pause while typing | Revised Proposal §VIII |
| Questions 3–5: papers, profile fields, disability type | Answered by the papers and by you | Thanks for sending them |
| Decision 8: wait for your check-in after 3A | I show you 3A and continue with 3B unless you stop me | The deadline |
| Decision 28: fix the Phase 2B leftovers in Phase 3 | Fixed during the audit days (Oct 17–18) | They mostly help the Lighthouse and NVDA checks |

**Worth knowing for the defense Q&A.** Because matching counts only listed accommodations, a fully remote job that doesn't list "Wheelchair-accessible entrance" shows it as missing for a wheelchair user, although they would work from home. The answer: employers state accommodations explicitly, by design; counting the work setup is a possible improvement after the defense.

---

## 5. How we'll know it's done

### 3A demo

| # | Demo step | Expected result |
|---|---|---|
| J1 | As a guest, open **Browse jobs** from the header | Only open jobs, newest first, with the count ("15 jobs"). Drafts and postings that are waiting, rejected, closed, past their date or deleted never appear |
| J2 | Type "developer" in search and tick **Screen reader software provided** | The list narrows after a short pause and the count is read out. The address keeps the filters; Back restores the previous list; the address in a new tab shows the same list |
| J3 | Go to page 2 | The page number is in the address; focus moves to the results heading |
| J4 | Open a job, then a draft's address | The job page shows accommodations first and links to the employer; the draft says the job isn't open |
| J5 | Open the employer's page | Details, Verified badge and open jobs; no registration number, team or emails |
| J6 | J1–J5 with the keyboard only, at 360 px | Everything works, no sideways scrolling |

### 3B demo

| # | Demo step | Expected result |
|---|---|---|
| C1 | Register as a job seeker | The dashboard's main action is **Tell us what you need** |
| C2 | Tick 5 needs and save; open **Find jobs** | Matches my needs is on: full matches first ("Meets all 5 of your needs"), then partial ones with what's missing |
| C3 | Switch to **All jobs** | Every open job appears, and jobs meeting none say so |
| C4 | Open a partly matching job | **How this job fits your needs** marks each need Provided or Missing |
| C5 | Fill in My profile with work experience and education, then add the digital résumé (question 3) | The résumé page reads like a résumé and prints cleanly; an uploaded PDF opens only for its owner |
| C6 | Log in as the employer and the admin | Neither can see the job seeker's needs, profile, résumé or disability type (also covered by server tests) |
| C7 | The admin retires one of the job seeker's needs | My needs marks it "no longer offered"; matching counts 4 needs |
| C8 | C1–C5 with the keyboard only at 360 px, and with a screen reader | Counts and changes are read out; nothing needs a mouse |

---

## 6. What gets built

### 6.1 Database changes

| Table | What it holds | Part |
|---|---|---|
| `candidate_profiles` (new) | One per job seeker: headline, location, contact number, about, skills, trainings, languages, disability type, show disability (off), résumé file path, name and upload date | 3B |
| `candidate_experiences` (new) | Work experience entries (job title, company, start, end or current, description) | 3B |
| `candidate_educations` (new) | Education entries (level, school, course, year finished or in progress) | 3B |
| `candidate_accommodation` (new) | The job seeker's needs (composite key, as in the proposal's database section) | 3B |
| `job_postings` (index only) | An index on status and closing date for the public list | 3A |

The proposal's single `experience` field becomes the list of entries above, so employers see a real work history.

### 6.2 Who can see what

| Information | The job seeker | Guests and other job seekers | Employers | Admins |
|---|---|---|---|---|
| Open jobs and public employer pages | ✓ | ✓ | ✓ | ✓ |
| Profile, résumé, needs | ✓ (can change) | — | — (Phase 4: applicants only) | — (Phase 6: user management) |
| Disability type | ✓ (can change) | — | — (Phase 4: applicants who allow it) | — |
| "Meets X of Y" | ✓ | — | — | — |

The server checks every rule. Hiding something in React is only for convenience.

### 6.3 Pages

**Public** (the header gains **Browse jobs**):

| Page | What's on it | Part |
|---|---|---|
| Home (updated) | A search bar that opens Browse jobs; three featured open jobs | 3A |
| Browse jobs | Search, category and accommodation filters, sort, "15 jobs", job list, page numbers. One quiet line for guests: "Have accommodation needs? Register as a job seeker to see how well each job fits you." | 3A |
| Job page | The 2B job layout: title, employer with badge (links to the employer page), department, accommodations panel, "At a glance", "About the job" | 3A |
| Employer page | §4.2, then the employer's open jobs | 3A |

**Candidate portal:**

| Page | What's on it | Part |
|---|---|---|
| Dashboard (updated) | Without needs: **Tell us what you need**. With needs: the best three matches with **See all matches**, and the profile sections still missing | 3B |
| Find jobs | Browse jobs, plus the **Show** switch (Matches my needs / All jobs), the match badge on every job and the **Best match** sort | 3B |
| Job page | The job page, plus **How this job fits your needs** above the accommodations | 3B |
| Employer page | The public employer page, inside the portal | 3B |
| My needs | The grouped checklist, who sees it, **Save my needs** | 3B |
| My profile | The sections in §4.1. **Save profile** for the form; the résumé uploads on its own, like the company logo | 3B |
| Résumé preview | The profile laid out as a résumé, with **Print or save as PDF** (question 3) | 3B |

### 6.4 New building blocks (names from the papers' component list)

| Building block | What it does for users | Part |
|---|---|---|
| `JobCard` | One job as a ruled row: title link, employer and badge, key facts as labelled pairs, and what it provides with an accommodation group icon beside each name | 3A |
| `AccommodationFilterPanel` | Search box (300 ms pause, Enter applies at once), category, accommodations; **Clear all filters**; one **Filters** section on phones that says how many are on | 3A |
| `Pagination` | Previous, numbers, Next; the current page marked for screen readers; 44 px targets | 3A |
| `EmptyState` | Says why the list is empty and what to do next | 3A |
| `MatchBadge` | "Meets 4 of 5 of your needs" and "Missing: …" | 3B |
| `NeedsFit` | The job page checklist: each need, Provided or Missing, with the employer's note | 3B |
| `ResumeView` | The profile laid out as a résumé, with print styles; reused for employers in Phase 4 | 3B |
| `EntryList` | Add, edit and remove work experience and education entries, with a labelled field set per entry | 3B |

### 6.5 Tests

**3A server tests:**
- Only open, not-expired (Philippine time), not-deleted postings are listed or shown.
- Search covers title, description, company name and location, and `%` and `_` are treated as plain characters.
- Category and accommodation (all ticked) filters, sorting, 12 per page, and a page past the end that comes back empty.
- The public posting shape leaves out the author, rejection reason, approval dates and verification details.
- Employer page rules (§4.2).
- The list is rate-limited and doesn't make extra queries per job.

**3B server tests:**
- Profile and entries: only the owner can read or change them; fields and entry limits are checked.
- Résumé: PDF only, up to 5 MB; replacing deletes the old file; only the owner can download it.
- Needs: unknown and retired types are refused; a retired need already saved stays but isn't counted.
- Matching: counts and missing names are right; Matches my needs shows only jobs meeting at least one need, in the right order; All jobs shows everything; `match=1` without a candidate login is ignored.
- Privacy: needs, profile, résumé and disability type never reach guests, other job seekers, employers or admins.
- Seeding twice changes nothing.

**Page tests:** filters in the address and Back; the 300 ms search pause; the count is read out; focus after a page change; badge wording (all, some, none, one need); the Show switch; adding and removing entries; résumé upload errors; automatic accessibility checks on every new page.

---

## 7. Look and feel (Frontend Design pass)

**The brief.** Phase 3's screens are where a job seeker decides whether a job is possible for them. The Phase 2 direction stays: purple for actions, amber only for accommodation promises, Atkinson Hyperlegible, ruled rows rather than cards, everything left-aligned. Phase 3 spends its one bold idea on the match.

**The one bold element: the match badge.** On every job in Find jobs, under the title and employer: **"Meets 4 of 5 of your needs"** in bold ink with an amber check, then "Missing: Adjustable workstation" in muted text with an open circle. On the job page it becomes **How this job fits your needs**, a checklist with an ink rule on its left, directly above the amber "Accommodations provided" panel. Ink means "your needs" and amber means "the employer's promises", so the two read as a pair without a new color.

**Colors (unchanged):** ink `#1c1a24` for text and the match count; muted `#4d4a5c` for "Missing" lines and facts; lavender `#f8f7fb` page; white `#ffffff` surfaces; purple `#5b21b6` for job titles (links), buttons and the current page number; amber `#a54a06` only for accommodations a job provides and needs it meets. Green and red stay for statuses, always with an icon and text.

**Type:** Atkinson Hyperlegible only. Page titles 34–42 px, "15 jobs" 26 px, job titles 21 px, body and badge 17 px.

**Find jobs, wide screens:**

```
Find jobs
Jobs ranked by how many of your 5 needs they meet.   Change my needs

[ Job title, skill or company                         ]  [ Search ]

Show: (o) Matches my needs   ( ) All jobs                   Sort by [ Best match  v ]

Filters                          12 jobs
                                 ------------------------------------------------------
Category                         Junior Web Developer
[ Any category        v ]        OpenDoor Demo Corp.    (check) Verified company
                                 (check) Meets 4 of 5 of your needs
Accommodations provided          (o) Missing: Adjustable workstation
Physical access                  Work setup: Remote   Employment type: Full-time
[ ] Wheelchair-accessible ...    Apply by: November 9, 2026
[ ] Accessible restroom          ------------------------------------------------------
...                              HR Assistant
Communication                    ...
...
[ Clear all filters ]            Previous   1   2   Next
```

**Find jobs, phones (360 px):** one column. Search, then the Show switch, then a closed **Filters** section ("Filters, 1 on"), then sort, the count and the list. Each fact gets its own line.

**Job page for a job seeker (wide):**

```
Junior Web Developer                                  (Open)
OpenDoor Demo Corp.   (check) Verified company
Department: IT

About the job                          | How this job fits your needs      <- ink rule
Build and maintain accessible web      | Meets 4 of 5 of your needs
pages for our clients ...              | (check) Flexible hours: Provided
                                       | (o) Adjustable workstation: Missing.
                                       |     You can ask the employer about it.
                                       |
                                       | Accommodations provided          <- amber rule (2B)
                                       | At a glance
```

**My profile:** one column of sections with headings (§4.1), each easy to jump to. Work experience and education entries are labelled groups ("Work experience 1 of 2") with **Edit** and **Remove**, and an **Add work experience** button. The résumé section shows the file name, upload date, **Replace** and **Remove**, and links to **Preview my résumé**.

**Checked against generic job-board defaults:**

| The generic default | Our choice | Why |
|---|---|---|
| A grid of identical cards with logos, tag chips and bookmark icons | Ruled rows; logos on the job and employer pages | Phase 2's "fewer boxes" rule; rows scan more easily under magnification |
| A "92% match" ring or bar | The sentence "Meets 4 of 5 of your needs" | Concept principle 4; a percentage hides which need is missing |
| A red ✕ for missing items | A muted open circle | It isn't the person's error; red is kept for statuses |
| Colored chips for accommodations | Plain words with a group icon | Chips would add a third color system |
| Results jumping on every key press | A 300 ms pause, then one spoken count | Screen readers don't chatter; focus never moves |
| Endless scrolling | Numbered pages kept in the address | Keyboard and screen reader users keep their place |
| A sliding filter sheet on phones | One Filters section that opens in place | Nothing traps focus; works at 200% zoom |

**Words on the screen:**

| Where | Text |
|---|---|
| Count | "15 jobs", "1 job", "No jobs"; read out as "15 jobs found" |
| No matches yet | "No open jobs meet your needs yet." and **Show all jobs** |
| No results | "No jobs match these filters. Try fewer filters or different words." and **Clear all filters** |
| Job not open | "This job isn't open. It may have closed or been removed." and **Browse open jobs** |
| Badge | "Meets all 5 of your needs", "Meets 4 of 5 of your needs", "Meets none of your 5 needs"; with one need, "Meets your need" or "Doesn't meet your need"; "Missing: A, B and 2 more" |
| Saved | "Your needs are saved. Find jobs now ranks jobs by them." and "Your profile is saved." |
| Disability type hint | "Optional. OpenDoor never uses this to match or filter jobs. Employers see it only if you tick the box below and apply to one of their jobs." |

**Accessibility:** each job is a list item with its title as heading and link, and the badge is ordinary text right after it. Every icon has text beside it. The results heading takes focus after a page change; filter changes keep focus and announce the count. Entries and filter groups are fieldsets with legends. Checkboxes keep the 2B 44 px click area. There's no new motion, and the résumé preview has print styles. Everything is checked at 360 px and 200% zoom.

---

## 8. Privacy and security checks

| Risk | How it's handled | Part |
|---|---|---|
| Unpublished postings reachable publicly | One "open job" rule for the list, job page and employer page; anything else answers "not found" | 3A |
| Employer registration details leaked | Separate public shapes with only public fields | 3A |
| Search abuse | `%`, `_` and `\` treated as plain characters; 100 characters and 8 words at most; 120 requests a minute per IP address | 3A |
| Needs, profile, résumé or disability type leaked | Read only from the logged-in job seeker's session; tests for what every other role receives | 3B |
| Résumé upload abuse | PDF only (file type and extension checked), 5 MB, a random stored name, never in a public folder, downloaded only by its owner (Phase 4: employers with an application) | 3B |
| Oversized profiles | At most 10 work and 10 education entries, with length limits on every field | 3B |
| Retired type added to needs by a hand-made request | The same check the posting form uses | 3B |

---

## 9. Order of work

| Step | Work | Done when |
|---|---|---|
| 1 | Server: open-job rule, search, filters, sort, pages; public posting and employer shapes; demo data | 3A server tests pass |
| 2 | `JobCard`, `AccommodationFilterPanel`, `Pagination`, `EmptyState`; Browse jobs, Job page, Employer page, Home | Demo J1–J5 work; I show you 3A |
| 3 | Server: profile, entries, résumé, needs, matching, candidate dashboard; demo job seekers | 3B server tests pass |
| 4 | My profile, résumé preview, My needs, Find jobs, `NeedsFit`, dashboard | Demo C1–C7 work |
| 5 | Checks (§4.2); keyboard, 360 px and screen reader pass (J6, C8); README; build notes; commit and push | Phase 3 finished (target: Mon Oct 12) |

---

## 10. Not in Phase 3

| Feature | Comes in |
|---|---|
| Apply (and the guest "Apply" link to log in), applications, applicants, interview accommodation request | Phase 4 (Oct 13–14) |
| Trust score on job and employer pages | Phase 5 (Oct 15) |
| Admin view of job seekers (user management) | Phase 6 (Oct 16) |
| Notifications, report a posting, feedback moderation, admin analytics | Phase 6, if time allows (Should-haves) |
| Saved jobs, display settings, forgot password, email notifications | After the defense (Could-haves) |
| Work setup and employment type filters; work setup counting toward matching | After the defense |

---

## 11. For groupmates: after pulling Phase 3

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

### A. Server addresses (named as in Modules and Features §4)

| Method | Address | Who | Purpose | Part |
|---|---|---|---|---|
| GET | `/api/job-postings?q=&category=&accommodations[]=&employer=&sort=&page=` | Anyone | Open jobs, 12 per page; `sort`: `newest`, `closing` | 3A |
| GET | `/api/job-postings/{id}` | Anyone | One open job (public shape), or "not found" | 3A |
| GET | `/api/employers/{id}` | Anyone | Public employer page (its jobs come from `/api/job-postings?employer=`) | 3A |
| GET | `/api/job-postings?…&match=1` | Logged-in job seeker | Matches my needs; adds `sort=match`. Every job carries `match`: `needs_total`, `needs_met`, `missing` (names) | 3B |
| GET | `/api/job-postings/{id}` | Logged-in job seeker | Also each need with `provided` or `missing` | 3B |
| GET, PUT | `/api/candidate/profile` | Job seeker | Own profile, including entries, name and privacy setting | 3B |
| PUT | `/api/candidate/accommodations` | Job seeker | Replace the list of needs | 3B |
| POST, GET, DELETE | `/api/candidate/resume` | Job seeker | Upload, download or remove the own PDF résumé | 3B |
| GET | `/api/candidate/dashboard` | Job seeker | Top three matches and the missing profile sections | 3B |

The public addresses read the session if there is one; no login is needed. A suspended account is treated as a guest.

### B. Main files

**Backend (`backend/`)**
- Migrations for the four new tables, plus an index on `job_postings`
- Enums: `EducationLevel`, `DisabilityType`
- Models: `CandidateProfile`, `CandidateExperience`, `CandidateEducation`; `User::candidateProfile()`; `JobPosting` scopes `publiclyVisible`, `search`, `providingAll`
- Services: `JobSearch` (filters, sort, pages, match count): one place, so the list, job page and dashboard always agree
- Requests: `JobSearchRequest`, `CandidateProfileRequest`, `CandidateAccommodationsRequest`, `ResumeRequest`
- Resources: `PublicJobPostingResource`, `PublicEmployerResource`, `CandidateProfileResource`
- Policy: `CandidateProfilePolicy`
- Controllers: `Public\JobPostingController`, `Public\EmployerController`, `Candidate\ProfileController`, `Candidate\AccommodationController`, `Candidate\ResumeController`, `Candidate\DashboardController`
- Seeders: `DemoEmployerSeeder` (two more companies), `DemoJobPostingSeeder` (more postings), `DemoCandidateSeeder` (two job seekers with profiles)
- Storage: résumés on the private disk locally, on R2 in production (Revised Proposal §XI); logos move there too at deployment, because Railway's disk is wiped on every deploy

**Frontend (`frontend/src/`)**
- Pages: `portals/public/BrowseJobsPage`, `JobPage`, `EmployerPage`, `HomePage` (updated); `portals/candidate/FindJobsPage`, `NeedsPage`, `ProfilePage`, `ResumePreviewPage`, `CandidateDashboard` (updated)
- Components: `components/jobs/JobCard`, `AccommodationFilterPanel`, `MatchBadge`, `NeedsFit`; `components/candidate/ResumeView`, `EntryList`; `components/ui/Pagination`, `EmptyState`
- Hooks and API: `hooks/useJobSearchParams`, `hooks/useDebouncedValue`; `api/jobs.js`, `api/candidate.js`
- Router and menus: public and candidate routes; the candidate menu in `portalMenus.js`; **Browse jobs** in `PublicLayout`

### C. Things to get right

1. **Philippine midnight versus UTC midnight:** reuse `JobPosting::today()` for the open-job rule.
2. **SQLite versus MariaDB:** use `whereHas` and `withCount` (as the proposal says), never `HAVING` without `GROUP BY`; test search with plain ASCII, because MariaDB ignores accents and SQLite doesn't.
3. **One match calculation** for the list, the job page and the dashboard.
4. **Needs and résumés never leave the server** except in their owner's responses.
5. **Address state:** Back and Forward restore results; a filter change resets the page to 1; the latest request wins (a 2B lesson).
6. **Focus:** keep focus on the page heading when a page finishes loading (a 2B lesson).

The list query, as the proposal describes it (whereHas and withCount):

```php
// The needs come from the logged-in job seeker's profile, never from the address.
JobPosting::publiclyVisible()                    // open, closes_on >= today in Manila, not deleted
    ->search($q)                                 // title, description, company name, location
    ->inCategory($category)
    ->providingAll($accommodationIds)            // whereHas(..., '>=', count), no HAVING
    ->when($needIds, fn ($query) => $query->withCount([
        'accommodations as needs_met' => fn ($q) => $q->whereIn('accommodations.id', $needIds),
    ]))
    ->when($matchMode && $needIds, fn ($query) => $query->whereHas(
        'accommodations', fn ($q) => $q->whereIn('accommodations.id', $needIds),
    ))                                           // Matches my needs: at least one need met
    ->orderByDesc('needs_met')->orderByDesc('approved_at')->orderBy('title')   // sort=match
    ->paginate(12);
```
