# Phase 2 Plan: Employer Side

> Status: **Phase 2 built.** 2A (2026-10-05): demo steps A1–A8 verified in the browser. 2B (2026-10-10): demo steps B1–B7 verified in the browser; 159 backend and 124 frontend tests pass.
> Part of: [CONCEPT_PLAN.md](CONCEPT_PLAN.md), build phase 2 of 7
> Builds on: [PHASE_1_PLAN.md](PHASE_1_PLAN.md) (accounts, roles, categories, accommodation types)
> Rev. 2 (2026-10-05): companies now have **departments** and **several HR accounts** joined by invite link; **individual employers** are allowed. Phase 2 is split into **2A** (employers and teams) and **2B** (job postings and approvals).
> Rev. 3 (2026-10-05): Phase 2B details decided (§3.3, decisions 24–38), including **Change closing date**, and a UI polish direction (§4.10).

---

## 1. What Phase 2 delivers

At the end of Phase 2, **employers can set up who they are, build their hiring team, and post jobs with structured accommodations**, and **admins can verify companies and approve postings**. This creates the job data that Phase 3 will search and match.

### Two kinds of employer

| | **Company** | **Individual employer** |
|---|---|---|
| Who | A business or organization (registered with DTI, SEC or CDA) | A person hiring for themselves, e.g., a household or a freelancer |
| People | One **owner** plus **HR officers**, grouped into **departments** | Just the person |
| Departments | Yes, each with its own HR limit | No |
| Verified badge | Yes, after an admin checks the registration number | No (nothing to verify) |
| Shown on postings as | Company name, department, and badge if verified | Person's name and "Individual employer" |

### The company hierarchy

```
Company (e.g., "Acme Corp.")              ← owner manages everything
├── Department: Human Resources (limit 3) ← HR officers here see only this department's postings
│   ├── HR officer: Ana
│   └── HR officer: Ben
└── Department: IT (limit 2)
    └── HR officer: Carla
```

The **employees** are the job seekers who get hired through postings (Phase 4). In Phase 5 they rate whether each promised accommodation was delivered.

### Phase 2A: Employers and teams
- Right after registering, an employer chooses **"I'm hiring for a company"** or **"I'm hiring for myself"**.
- **Company owners:** fill in the company profile and logo; submit the DTI, SEC or CDA number for verification; create departments; set each department's HR limit (up to the admin's cap); invite HR officers with a one-time link; move or remove HR officers.
- **HR officers:** open the invite link, create their account, and land directly in their department.
- **Individual employers:** fill in a simple employer profile (name, location, about, optional photo or logo).
- **Admins:** verify or reject companies, and set the **platform cap** on HR officers per department.
- **The OpenDoor logo** appears beside the name in every header (a placeholder you can replace, see §4.9).

### Phase 2B: Job postings and approvals
- Owners, HR officers and individual employers **create job postings** with every field required: title, description, category, location, employment type, work setup, interview format, closing date, and at least one accommodation (each with an optional note).
- **Save a draft, submit for approval, edit, close, reopen and delete.** Editing an open posting sends it back for approval. **Changing only the closing date** of an open posting doesn't (decision 25).
- **Admins approve or reject postings**, with a reason.
- **Also fixed:** a category used by any posting can no longer be deleted, and neither can a department (decision 20).
- **The UI gets a polish pass** (§4.10): accommodations become the headline of every posting, with a firmer heading scale and fewer boxes.

---

## 2. How we'll know it's done

### Phase 2A demo

| # | Demo step | Expected result |
|---|---|---|
| A1 | Register as an employer and choose "I'm hiring for a company"; enter the company details and a DTI number | Company page shows "Verification: waiting for review"; you are the owner, with one starting department |
| A2 | The admin verifies the company | The owner sees the **Verified** badge |
| A3 | The owner adds a department "IT" with a limit of 2, then tries to set a limit above the admin's cap | Department is created; the over-cap limit is refused with a message naming the cap |
| A4 | The owner creates two invites for IT, then tries a third | Two one-time links appear; the third is refused: "IT has reached its limit of 2" |
| A5 | Someone opens an invite link and registers | They land in the Employer portal as an HR officer in IT; the link no longer works for anyone else |
| A6 | Register another employer as "I'm hiring for myself" | Simple employer profile; no departments, no verification section |
| A7 | The HR officer tries to open the company settings, departments or invites | Refused (403); these pages are not in their menu |
| A8 | The owner removes the HR officer | They lose access to the company; on their next login they are asked to set up an employer profile or use a new invite |

### Phase 2B demo

| # | Demo step | Expected result |
|---|---|---|
| B1 | An HR officer in IT creates a posting with three accommodations (two with notes), saves a draft, then submits it | Posting shows "Waiting for approval", under the IT department |
| B2 | The admin rejects it with a reason; the HR officer edits and resubmits; the admin approves | Posting shows "Open" |
| B3 | The posting is closed, then reopened; a draft is deleted | Statuses change correctly; the deleted draft disappears |
| B4 | An HR officer in another department, and a different company, both try to open that posting's address | Both refused (403). The **owner** can see and manage it |
| B5 | An individual employer creates and submits a posting | Works the same; shown as "Individual employer" |
| B6 | The admin tries to delete a category that a posting uses | Refused, with a message suggesting renaming instead |
| B7 | A1, A4, A5, B1 and B2 again using only the keyboard, at phone width (360 px) | Everything works, no sideways scrolling |

---

## 3. Decisions

### 3.1 Approved (2026-10-05)

| # | Decision |
|---|---|
| 1 | Admin **Employer verification** and **Posting approvals** screens are built now |
| 2 | Public employer page and public job details page move to Phase 3; the job details layout is built now as a Preview |
| 3 | Hierarchy: **Company → Departments → HR officers**, with one owner per company. **Individual employers** are also allowed |
| 3a | **Department HR limits:** the company owner sets a limit per department, never above a **cap set by the OpenDoor admin** |
| 3b | **Joining:** the owner creates a one-time **invite link** for a department and shares it; the HR officer registers through it |
| 3c | **Visibility:** HR officers see and manage **only their own department's** postings (and, in Phase 4, applicants). The owner sees and manages everything in the company |
| 4 | Verification is **not** required to post; postings are still admin-approved |
| 5 | **Complete format:** every posting field is required to submit, plus at least one accommodation. Drafts can be saved incomplete |
| 6 | Editing an **Open** posting sends it back to admin approval |
| 7 | Reopening a closed posting needs no new approval, but the closing date must be in the future |
| 8 | Company and individual logos are optional; PNG, JPG or WebP up to 2 MB, shown through an API address. **Plus** an OpenDoor logo placeholder beside the name in the header |
| 9 | Registration number: choose DTI, SEC or CDA, then a number of 5–20 letters, digits or dashes; the admin checks it by hand; changing it removes the badge until re-checked |
| 10 | Employment type: Full-time, Part-time, Contract, Internship. Work setup: On-site, Hybrid, Remote. Interview format: Online, On-site, Online or on-site |
| 11 | Closing date between tomorrow and 6 months ahead; postings past it show as Closed automatically |
| 12 | Demo data, with local default passwords **`Admin_1234`** (admin) and **`Demo_1234`** (all demo accounts) |

### 3.2 Team design decisions (approved 2026-10-05)

| # | Question | My recommendation | Why |
|---|---|---|---|
| 13 | Split Phase 2 into **2A (employers and teams)** and **2B (postings and approvals)**, with a check-in after 2A? | **Yes** | It's now about twice the original size. You can test 2A in the browser before postings are built on top of it |
| 14 | Starting numbers | **Admin cap: 10 HR officers per department. New departments start with a limit of 3.** The admin can change the cap; owners can change each department's limit up to the cap | Small enough to matter, big enough for real HR teams |
| 15 | What counts toward a department's limit? | **HR officers already in the department plus invites not yet used.** The owner doesn't count. Revoking an unused invite frees its place | Otherwise an owner could hand out 20 links for a limit of 3 |
| 16 | Lowering limits | **An owner can't set a limit below the number of HR officers already in the department** (they must move or remove someone first). **If the admin lowers the cap, existing teams keep their members**, but those departments can't invite more until they're under the new cap | Nobody loses access by surprise |
| 17 | Invite links | **One-time use, expire after 7 days, can be revoked by the owner.** The link is shown once with a Copy button; the server stores only a scrambled version of it | Safe to paste in a chat. A leaked old link stops working |
| 18 | Where do new employers choose company or individual? | **On a "Set up your employer profile" screen right after registering**, not on the Register page. The same screen appears for anyone with no employer profile (including your existing test accounts and removed HR officers) | Keeps the Register page short, and handles every "no profile yet" case in one place |
| 19 | When the owner removes an HR officer | **Their account stays, but it is no longer connected to the company.** Postings they created stay with the department. At their next login they see the setup screen. Owners can also **move** an HR officer to another department (if it has room) | Nothing they posted disappears, and no account is deleted without the person's choice |
| 20 | Deleting a department | **Only when it has no HR officers and no postings.** Renaming is always allowed | Postings must always belong to a department |
| 21 | Ownership | **Exactly one owner per company, the person who created it. Transferring ownership is not in Phase 2** | Keeps permissions simple; transfer can be added later if needed |
| 22 | Who creates postings in a company? | **The owner (choosing the department) and HR officers (always their own department)** | Matches decision 3c |
| 23 | Demo accounts | `admin@opendoor.test` (`Admin_1234`); demo company **"OpenDoor Demo Corp."** (verified) owned by `employer@opendoor.test`, with departments **Human Resources** and **IT**; HR officer `hr@opendoor.test` in Human Resources; individual employer `individual@opendoor.test`; job seeker `candidate@opendoor.test`. All demo accounts use `Demo_1234`. **5 sample postings** across both departments and the individual | Covers every role and permission in the demo |

### 3.3 Phase 2B details (approved 2026-10-05)

Gaps in §1–§4 that needed an answer before building postings.

| # | Decision | Why |
|---|---|---|
| 24 | A posting **waiting for approval can still be edited**. It stays waiting (and must stay complete); the admin reviews the latest version | Lets people fix a typo without withdrawing the posting |
| 25 | **Change closing date:** open postings get a separate action that sets a new date (tomorrow to 6 months ahead). It needs **no approval**, like Reopen (decision 7). Saving anything else on an open posting still sends it back for approval | Extending a deadline shouldn't take a live posting offline |
| 26 | Editing a **Closed** posting also sends it back for approval | Otherwise Reopen, which needs no approval, would publish unapproved changes |
| 27 | **Rejected** postings: saving keeps them Rejected until they are resubmitted. Resubmitting without changes is allowed | The employer may disagree with the reason or fix it elsewhere |
| 28 | **Company postings always have a department, even as drafts** (decision 20). It is chosen automatically when the company has one department. HR officers' postings always go to their own department; individual employers' postings have none | Keeps department visibility (decision 3c) true for every posting |
| 29 | The **closing date** is a date without a time: the posting stays open until the end of that day, Philippine time. The range (tomorrow to 6 months ahead) is checked whenever a posting is submitted or saved while waiting, and when changing the date or reopening; not when saving a draft or a rejected posting | Clear for employers and job seekers; drafts can wait |
| 30 | **Location** is required free text, pre-filled from the employer's address. For remote jobs the hint suggests e.g. "Anywhere in the Philippines" | Every field is required (decision 5), and remote jobs still have a "where" |
| 31 | **Retired accommodation types** already on a posting stay, shown as "no longer offered". They can be removed but not added again | Nothing changes on a posting without the employer's choice |
| 32 | A **department or category used by any posting**, including deleted ones, can't be deleted. The message suggests renaming | Deleted postings are kept (§4.4), so what they point to must stay |
| 33 | **Posting approvals** has tabs **Waiting** (oldest first), **Open** and **Rejected**. The review page shows the employer's verification badge, "Changed after approval" when an approved posting was edited, and a note when the closing date passed while it was waiting (approving it then shows it as Closed until the employer reopens it). **Admins never see drafts** | Same pattern as Employer verification; drafts are private |
| 34 | **The server decides the buttons:** every posting in the API lists the actions the person may take on it | The status rules live in one place (the server), not copied into React |
| 35 | **Addresses:** all employer posting addresses are under `/api/employer/…` (Appendix A), which keeps `/api/job-postings` free for Phase 3's public search. Submitting happens when saving (`submit: true`) | Matches the rest of the employer API |
| 36 | **The five demo postings:** Human Resources: *HR Assistant* (Open) and *Recruitment Coordinator* (Waiting); IT: *Junior Web Developer*, remote (Open) and *IT Support Specialist* (Draft); individual employer: *Part-time Home-based Bookkeeper* (Open). Added only when those employers exist and have no postings yet | Every list and the admin queue have something to show |
| 37 | The **UI polish** (§4.10) is done in the shared building blocks, so existing pages improve too, with no change in behavior | One pass, consistent everywhere |
| 38 | **Checks before finishing:** Superpowers code review and verification, plus GSD's code-review, UI-audit and security agents run directly on the changed files. GSD's `.planning/` folder is not set up in Phase 2 (it can be generated from `docs/` later with `/gsd-ingest-docs`) | Two independent reviews; `docs/` stays the team's plan |

---

## 4. What gets built

### 4.1 Database changes

| Table | What it holds | Phase |
|---|---|---|
| `employers` (new) | The hiring party: **type** (company or individual), **name**, **industry**, **address**, **description**, **logo**, and for companies the **registration type and number**, **verification status**, **verified date** and **rejection reason**. (The trust score is added here in Phase 5, as in the proposal.) | 2A |
| `departments` (new) | A company's departments: **name** (unique within the company) and **HR limit** | 2A |
| `employer_members` (new) | Which user belongs to which employer: **role** (owner or HR officer) and **department** (HR officers only). One membership per user | 2A |
| `department_invites` (new) | One-time invites: department, who created it, a scrambled copy of the link's code, **expiry date**, and when it was used or revoked | 2A |
| `app_settings` (new) | Platform settings the admin can change; first entry: **HR officers per department cap** | 2A |
| `job_postings` (new) | Each posting: employer, **department** (empty for individual employers), **created by**, category, title, description, location, employment type, work setup, interview format, closing date, **status** and rejection reason. Deleted postings are hidden but kept | 2B |
| `job_posting_accommodation` (new) | Accommodations each posting provides, with an optional **note** | 2B |

### 4.2 Who can do what

| Action | Owner | HR officer | Individual employer | Admin |
|---|---|---|---|---|
| Edit company / employer profile and logo | ✓ | View only | ✓ (own profile) | View |
| Submit registration number for verification | ✓ | — | — | — |
| Verify or reject a company | — | — | — | ✓ |
| Create, rename, delete departments; set HR limits | ✓ (limit ≤ cap) | — | — | — |
| Create and revoke invites; move or remove HR officers | ✓ | — | — | — |
| Set the platform cap | — | — | — | ✓ |
| Create and manage job postings | ✓ (any department) | ✓ (own department only) | ✓ (own) | — |
| Approve or reject postings | — | — | — | ✓ |

Every rule is checked by the server (Laravel Policies). Hiding a button in React is only for convenience.

### 4.3 How an HR officer joins

1. The owner opens **Team**, picks a department, and clicks **Create invite** (refused if the department is full).
2. OpenDoor shows a link like `https://<domain>/join/8fK2…` **once**, with a **Copy link** button and the expiry date.
3. The owner sends it to the HR officer however they like (chat, email, etc.).
4. The HR officer opens the link and sees "You've been invited to join **IT** at **Acme Corp.** as an HR officer", then fills in name, email, password and privacy consent.
5. They land in the Employer portal, in the IT department. The link stops working.

Links that are expired, revoked, already used, or for a department that has since become full show a plain explanation and "Ask the company owner for a new invite."

### 4.4 Life of a job posting (2B)

| From | Action | To | Who |
|---|---|---|---|
| *(new)* | Save draft | **Draft** | Owner, HR officer (own department) or individual |
| *(new)* or Draft | Submit for approval | **Waiting for approval** | Same (all fields and at least 1 accommodation required) |
| Draft | Edit and save | **Draft** | Same |
| Waiting for approval | Edit and save | **Waiting for approval** | Same (must stay complete, decision 24) |
| Waiting for approval | Approve | **Open** | Admin |
| Waiting for approval | Reject, with a reason | **Rejected** | Admin |
| Rejected | Edit and save | **Rejected** | Owner, HR officer or individual |
| Rejected | Resubmit (with or without changes) | **Waiting for approval** | Same |
| Open | Edit and save | **Waiting for approval** | Same (warned first) |
| Open | Change closing date | **Open** | Same (no approval, decision 25) |
| Open | Close | **Closed** | Same |
| Closed | Reopen | **Open** | Same (new closing date between tomorrow and 6 months ahead) |
| Closed | Edit and save | **Waiting for approval** | Same (warned first, decision 26) |
| Open | Closing date passes | Shown as **Closed** (can be reopened) | Automatic |
| Any | Delete | Hidden from every list, kept in the database | Same |

Any other change is refused with a plain message.

### 4.5 Company verification (2A)

| From | Action | To | Who |
|---|---|---|---|
| Not submitted | Enter registration type and number | **Waiting for review** | Owner |
| Waiting for review | Verify | **Verified** (badge shown) | Admin |
| Waiting for review | Reject, with a reason | **Rejected** | Admin |
| Rejected | Correct the number and resubmit | **Waiting for review** | Owner |
| Verified | Change the registration number | **Waiting for review** (badge removed) | Owner |

### 4.6 Pages

**Public:**

| Page | What's on it |
|---|---|
| Join a team (`/join/:code`) (2A) | Who invited you (company and department), then the registration form without the "looking for a job / hiring" question |

**Employer portal.** The menu depends on the person:

| Owner | HR officer | Individual employer |
|---|---|---|
| Dashboard · Company · Team · Job postings | Dashboard · Job postings | Dashboard · My profile · Job postings |

| Page | What's on it | Phase |
|---|---|---|
| Set up your employer profile | "Who are you hiring for?": **A company or organization** (company name, industry, address) or **Myself** (name and location). Shown after registering, and to anyone without an employer profile | 2A |
| Dashboard (updated) | Owner: verification status, departments with how many places are used ("2 of 3"), postings by status. HR officer: their department and its postings by status. Individual: postings by status | 2A, numbers grow in 2B |
| Company (owner) | Company form, logo upload and preview, and the **Verification** section (status, rejection reason, registration type and number) | 2A |
| My profile (individual) | Name, location, about, optional photo or logo | 2A |
| Team (owner) | One section per department: name, HR limit ("2 of 3 places used"), HR officers with **Move** and **Remove**, unused invites with expiry and **Revoke**, and **Create invite**. Add, rename and delete departments | 2A |
| Job postings | Postings with status badge, department, closing date and actions (only the ones the server allows, decision 34); filter links (All · Open · Waiting · Drafts · Rejected · Closed). The owner also gets a department filter. **Close**, **Reopen** and **Change closing date** work from the list | 2B |
| Create / Edit posting | Every field required to submit; department chooser for the owner; accommodation picker with optional notes; **Save draft** and **Submit for approval**. Editing an open or closed posting shows a warning first and the button says **Save and send for approval**; a rejected posting shows the admin's reason | 2B |
| Preview posting | The posting as job seekers will see it (reused as the public job page in Phase 3) | 2B |

**Admin portal** (menu gains **Employer verification**, **Posting approvals** and **Settings**):

| Page | What's on it | Phase |
|---|---|---|
| Dashboard (updated) | Companies waiting for verification and postings waiting for approval, with counts | 2A / 2B |
| Employer verification | Companies by status (Waiting · Verified · Rejected), with details, registration type and number, **Verify** or **Reject** (asks for a reason) | 2A |
| Settings | **HR officers per department cap**, with a note on what happens when it's lowered (decision 16) | 2A |
| Posting approvals | Tabs **Waiting** (oldest first), **Open** and **Rejected** (decision 33) | 2B |
| Review posting | Full posting with the employer's verification badge and "Changed after approval" when relevant, plus **Approve** or **Reject** (asks for a reason) | 2B |

### 4.7 New reusable building blocks

| Building block | What it does for users | Phase |
|---|---|---|
| Verified badge | "✓ Verified company", always with text | 2A |
| File upload (logo) | Labelled file input, accepted types and size in the hint, preview image described by the company name, plain errors | 2A |
| Copy link box | Read-only field with the invite link, a **Copy link** button, and "Link copied" announced to screen readers | 2A |
| Reason dialog | Confirm dialog with a required text box, for rejecting companies and postings | 2A |
| Places counter | "2 of 3 places used" as text, with a full-department message | 2A |
| Accommodation picker | Grouped checklist with a simple icon per group (always with its text); ticking an item reveals its labelled note field. Reused for candidate needs and filters in Phase 3 | 2B |
| Posting status badge | A distinct icon + text for Draft, Waiting for approval, Open, Rejected, Closed | 2B |
| Filter tabs | Links that mark the active filter (`aria-current`). Built in 2A; now keeps other filters (e.g., the department) when switching | 2A, 2B |
| Job details | Read-only posting layout for Preview, Review and the Phase 3 public page, with the accommodations panel as its headline (§4.10) | 2B |
| Closing date dialog | Date field with the allowed range in its hint; used by **Reopen** and **Change closing date** | 2B |

### 4.8 Tests

**Phase 2A server tests:**
- Setup: an employer with no profile can create a company (and becomes its owner with one department) or an individual profile, once.
- Company and individual profiles: only the owner or individual can edit; HR officers can view their company; job seekers are refused.
- Logo: accepts PNG, JPG and WebP up to 2 MB; rejects others.
- Verification: submit, verify, reject (reason required); changing the number removes the badge; individuals can't submit.
- Departments: owner creates, renames, deletes (only when empty); names unique within the company.
- Limits: can't exceed the admin cap; can't go below current HR officers; invites plus members never exceed the limit; revoking frees a place; a lower admin cap blocks new invites but keeps members.
- Invites: valid link registers an HR officer into the right department; used, expired, revoked and full-department links are refused; the stored code is not the code in the link.
- Members: owner moves (only into a department with room) and removes HR officers; a removed officer loses access.
- Permissions: HR officers get 403 on company editing, departments, invites and members; owners of company A get 403 on company B.
- Admin: only admins set the cap; cap must be at least 1.
- Seeding twice creates no duplicates and never resets a password.

**Phase 2B server tests:**
- A draft saves with just a title (plus a department for company postings); submitting needs every field and at least 1 accommodation; notes are saved; retired accommodations can't be added, but ones already on a posting may stay.
- Every allowed status change works, every other is refused; editing an open or closed posting returns it to waiting; editing a waiting posting keeps it waiting; reopening and changing the closing date need a date between tomorrow and 6 months ahead, and neither needs approval.
- An open posting past its closing date is listed and filtered as Closed, and can be reopened.
- **Department visibility:** an HR officer can't view, edit, delete or change the status of another department's posting (403); the owner can; another company can't.
- An HR officer's postings always go to their own department, even if a different department is sent.
- Individual employers' postings have no department.
- Each posting lists the actions the person may take (decision 34).
- Admin approve and reject (reason required); only waiting postings can be decided; admins never see drafts.
- Categories and departments used by any posting (including deleted ones) can't be deleted.
- Dashboard counts match the postings each person may see.

**Page tests (both parts):** picker notes appear only when ticked; badges show text; the reason dialog needs a reason; the copy-link box announces "Link copied"; the menu matches the person's role; the owner gets the department chooser and HR officers don't; filter tabs keep the department filter; automatic accessibility checks pass.

### 4.9 The OpenDoor logo (where to paste yours)

- I'll create a placeholder at **`frontend/public/opendoor-logo.svg`** and show it beside "OpenDoor" in every header. It is marked as decorative, since the name next to it already says "OpenDoor".
- **To use your real logo:** save it over that file with the same name. In Finder, open the project folder → `frontend` → `public`, and replace `opendoor-logo.svg`.
- **If your logo is a PNG** (or another format), save it in the same folder as `opendoor-logo.png` and tell me. It's a one-line change to point the header at it.
- A square image looks best; it is shown about 32 px tall.

### 4.10 UI polish (2B)

**Direction:** a job posting is a promise, so **accommodations are the headline** of every posting, not a list at the bottom.

| | Choice |
|---|---|
| Color | The approved palette stays: purple `#5b21b6` for actions, links and the current page; ink `#1c1a24` for text; lavender `#f8f7fb` page and white surfaces; **amber `#a54a06` only for accommodation promises**; green and red only for statuses (always with an icon and text) |
| Type | **Atkinson Hyperlegible** only (made for low-vision readers). A firmer scale: page titles 34–42 px, sections 26 px, subsections 21 px, body 17 px; lines of text under about 70 characters |
| Layout | Fewer boxes. Lists of postings are ruled rows, not a grid of identical cards; cards stay only for things handled as a unit (dashboard tiles, departments). Left-aligned throughout |
| The one bold element | The **accommodations panel**: an amber rule, a simple icon per accommodation group (always with its text), and each accommodation with its note |
| Motion | Only one: ticking an accommodation expands its note field. Off when the device asks for reduced motion |
| Avoided | All-caps labels above headings, decorative gradients and shadows, dot-separated detail lines, "coming soon" tiles once a feature exists |

**Job details** (Preview, admin Review, and the Phase 3 public page): title and status; employer name with the verified badge (or "Individual employer") and department; then, on wide screens, the description on the left and the accommodations panel plus "At a glance" (work setup, employment type, location, interview format, closing date) on the right. On phones: title, employer, accommodations, at a glance, then the description.

**Shared building blocks** get the polish, so existing pages improve with no change in behavior: heading scale, a page header (title, short intro, main action), status badges, dashboard tiles with real counts, and empty states that say what to do next.

---

## 5. Order of work

**Phase 2A: Employers and teams**

| Step | Work | Done when |
|---|---|---|
| 1 | Tables, models, permission rules; platform cap setting; seeder default passwords changed to `Admin_1234` / `Demo_1234` | Tables visible in phpMyAdmin; rule tests pass |
| 2 | Setup, company and individual profile, logo and verification endpoints | Server tests pass |
| 3 | Departments, limits, invites, join and member endpoints; admin verification and cap endpoints | All 2A server tests pass |
| 4 | Building blocks, OpenDoor logo placeholder, setup screen, Company, My profile, Team and Join pages; admin Verification and Settings pages | Demo steps A1–A8 work in the browser |
| 5 | Demo company, departments and team accounts in the seeder; README update; commit | **Check-in with you before 2B** |

**Phase 2B: Job postings and approvals**

| Step | Work | Done when |
|---|---|---|
| 6 | Posting tables, status rules, department-aware permissions | Rule tests pass |
| 7 | Posting endpoints; admin approval endpoints; category and department delete guards; employer dashboard counts; demo postings | All 2B server tests pass; backend commit |
| 8 | UI polish of the shared building blocks (§4.10); accommodation picker, badges, filter tabs, job details, closing date dialog; Job postings, form and Preview pages; admin Approvals and Review pages; dashboards | Demo steps B1–B6 work |
| 9 | Checks (decision 38) and fixes; keyboard and phone-width pass (B7); README update; frontend commit | Phase 2 finished |

---

## 6. Not in Phase 2

| Feature | Comes in |
|---|---|
| Public job list, search, filters and "Matches my needs"; public employer and job pages | Phase 3 |
| Candidate profile and accommodation needs | Phase 3 |
| Applications and applicants (department-scoped, as decided in 3c) | Phase 4 |
| Trust score on employer pages | Phase 5 |
| Notifications (e.g., "Your invite was used", "Posting approved") | Phase 6 |
| Sending invite links by email from OpenDoor (owners copy and share the link instead) | Later, with email set up |
| Transferring company ownership | Not planned for now |
| Salary field (not in the proposal) | Not planned |

---

## 7. For groupmates: after pulling Phase 2

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

`db:seed` adds the demo company, its departments, the HR officer, the individual employer and the sample postings. It never changes an account that already exists, so your current passwords stay as they are. New demo accounts get `Demo_1234`.

---

## Appendix: technical reference

### A. Server addresses (API endpoints)

**Phase 2A**

| Method | Address | Who | Purpose |
|---|---|---|---|
| POST | `/api/employer/setup` | Employer without a profile | `type`: `company` (+ `name`, `industry`, `address`) or `individual` (+ `name`, `address`) |
| GET, PUT | `/api/employer/profile` | Owner / individual (HR: GET only) | Company or individual profile |
| POST, DELETE | `/api/employer/profile/logo` | Owner / individual | Upload or remove the logo |
| GET | `/api/employers/{employer}/logo` | Anyone | Logo image (streamed; R2 redirect later) |
| POST | `/api/employer/verification` | Owner | `registration_type` + `business_reg_no` |
| GET, POST | `/api/employer/departments` | Owner | List (with members, invites, places used) / create |
| PUT, DELETE | `/api/employer/departments/{department}` | Owner | Rename or change limit / delete when empty |
| POST | `/api/employer/departments/{department}/invites` | Owner | Create invite; returns the link once |
| DELETE | `/api/employer/invites/{invite}` | Owner | Revoke |
| PATCH, DELETE | `/api/employer/members/{member}` | Owner | Move to another department / remove |
| GET | `/api/invites/{code}` | Anyone | Invite preview (company, department, still valid?) |
| POST | `/api/invites/{code}/accept` | Guest | Register as an HR officer through the invite |
| GET | `/api/admin/employers?verification=` | Admin | Companies by verification status |
| PATCH | `/api/admin/employers/{employer}/verify` | Admin | `decision`: `approve` / `reject` (+ `reason`) |
| GET, PUT | `/api/admin/settings` | Admin | Platform cap |
| GET | `/api/employer/dashboard`, `/api/admin/dashboard` | Employer, Admin | Dashboard counts |

**Phase 2B**

| Method | Address | Who | Purpose |
|---|---|---|---|
| GET | `/api/employer/job-postings?status=&department=` | Owner, HR, individual | Postings they may see; `status` uses the shown status (an expired open posting is `closed`); `department` for owners |
| GET | `/api/employer/job-postings/{posting}` | Same (permission-checked) | One posting, any status, with the `actions` the person may take |
| POST | `/api/employer/job-postings` | Same | Create (`submit: true` submits straight away; the owner sends `department_id`) |
| PUT, DELETE | `/api/employer/job-postings/{posting}` | Same | Save (`submit: true` submits a draft or rejected posting; open and closed postings always go back to waiting) / soft-delete |
| PATCH | `/api/employer/job-postings/{posting}/status` | Same | `action`: `close`, `reopen` (+ `closes_on`), `change_closing_date` (+ `closes_on`) |
| GET | `/api/employer/dashboard` | Owner, HR, individual | Posting counts by status (whole company for owners, own department for HR officers) |
| GET | `/api/admin/job-postings?status=`, `/api/admin/job-postings/{posting}` | Admin | Approval queue (`pending` oldest first, `open`, `rejected`) / one posting (never drafts) |
| PATCH | `/api/admin/job-postings/{posting}/approve` | Admin | `decision`: `approve` / `reject` (+ `reason`); only waiting postings |

### B. Main files

**Backend (`backend/`)**
- Migrations: `employers`, `departments`, `employer_members`, `department_invites`, `app_settings` (2A); `job_postings`, `job_posting_accommodation` (2B)
- Enums: `EmployerType` (company, individual), `MemberRole` (owner, hr), `VerificationStatus`, `RegistrationType` (dti, sec, cda); `PostingStatus` with `canTransitionTo()`, `EmploymentType`, `WorkSetup`, `InterviewFormat` (2B)
- Models: `Employer`, `Department`, `EmployerMember`, `DepartmentInvite`, `AppSetting`; `User::membership()`; `JobPosting` (SoftDeletes) (2B)
- Services: `TeamCapacity` (places used = members + open invites; limit and cap checks), `InviteService` (create, hash, accept, revoke), `JobPostingWorkflow` (2B: saving, status changes, the actions list)
- Policies: `EmployerPolicy`, `DepartmentPolicy`, `DepartmentInvitePolicy`, `EmployerMemberPolicy`; `JobPostingPolicy` with department scope (2B)
- Middleware: `employer.profile` (sends employers without a profile to setup; the API answers 409 "Set up your employer profile first")
- Seeders: `UserSeeder` defaults `Admin_1234` / `Demo_1234`; `DemoEmployerSeeder` (company, departments, HR officer, individual) (2A); `DemoJobPostingSeeder` (2B)
- Controllers (2B): `Employer\JobPostingController`, `Employer\JobPostingStatusController`, `Employer\DashboardController`, `Admin\JobPostingApprovalController`; `JobPostingResource`

**Frontend (`frontend/src/`)**
- Pages: `portals/employer/SetupPage`, `CompanyPage`, `IndividualProfilePage`, `TeamPage`; `portals/public/JoinPage`; `portals/admin/EmployerVerificationPage`, `SettingsPage` (2A); `JobPostingsPage`, `JobPostingFormPage`, `JobPostingPreviewPage`, `admin/PostingApprovalsPage`, `admin/PostingReviewPage` (2B)
- Components: `VerificationBadge`, `FileUpload`, `CopyLinkBox`, `ReasonDialog`, `PlacesCounter`, `FilterTabs` (2A); `AccommodationPicker`, `AccommodationGroupIcon`, `PostingStatusBadge`, `JobDetails`, `ClosingDateDialog` (2B)
- API and lists (2B): `api/jobPostings.js`; `lib/postingOptions.js` (employment types, work setups, interview formats)
- Auth: `/api/me` also returns the employer membership (type, role, department), so menus and route guards can tell owner, HR officer and individual apart
- Logo: `public/opendoor-logo.svg` placeholder, shown in `PublicLayout` and `PortalLayout`

---

## Phase 2A build notes (2026-10-05)

Found and fixed while testing in the browser:
- **XAMPP's MariaDB overwrote invite expiry dates.** MariaDB 10.4 adds "ON UPDATE CURRENT_TIMESTAMP" to the first required `timestamp` column, so accepting an invite reset its expiry. Fixed with a migration that makes `expires_at` a `dateTime`; the README now has the rule for future migrations.
- **Logging in from a `?next=` link went to the dashboard** instead of the requested page. The login route guard now honors `next` itself (with the same "internal paths only" check).
- **The admin's Verify dialog stayed open** after a successful decision; it now closes and focus moves to the list heading.
- **Radio cards read their title and description as one run-on name** for screen readers; the title is now the name and the description is attached as a hint (also improves the Register page).
- **Focus was lost after moving an HR officer** to another department; it now lands on that department's heading.
- **Filter tabs and the menu both said "current page"**; filters now say "current item".
- XAMPP's PHP image library can't create WebP files, so the logo test uses PNG/JPG fixtures (real WebP uploads are still accepted).

## Phase 2B build notes (2026-10-10)

Checked before finishing (decision 38): a Superpowers code review, plus GSD's code review, UI audit and security audit (all 8 threats in the threat model are handled). Demo steps B1–B7 were walked through in the browser on a separate copy of the database (`opendoor_verify`), so the `opendoor` demo data stayed as it was.

Found and fixed:
- **An approval could publish text the admin never saw.** Employers can edit a posting while it waits (decision 24), so Approve and Reject now send the version the admin reviewed. If the posting changed meanwhile, the admin sees "This posting changed while you were reviewing it." An employer save that lands right after an approval sends the posting back for review.
- **Closing a dialog while its request was running crashed the page** (Job postings, Categories). Dialogs now stay open until the request finishes.
- **Focus was lost** after Close or Reopen (it now moves to the posting's title) and when the Create or Edit posting form finished loading (it now stays on the page heading).
- **Switching filters quickly could show the wrong list.** The latest request now wins.
- **Raw server text** such as "No query results for model…" now reads "We couldn't find that. It may have been deleted."
- **A long link in a description scrolled the page sideways on phones.** Long words now wrap.
- **From the visual pass:**
  - Accommodation checkboxes have a 44 px click area, and the footer and logo links are 44 px tall.
  - Dashboard counts are ink, because purple is kept for things you can click.
  - The form's closing date section is now called "When applications close".
  - A hand-edited `?department=` no longer leaves the list loading forever.
  - Empty lists name the filtered department.
  - Dashboards and Posting approvals say when they can't load, with Try again.
  - A closing date the server refuses is shown on the date field.
  - Years with five digits are refused.
- **Limits:** a posting lists at most 50 accommodations, and the admin review marks types that are no longer offered (decision 31).

Left for later:
- The JavaScript bundle is 540 kB (Vite warns above 500 kB). Loading each page's code separately would fix it.
- Lists show at most 200 rows and don't say so.
- On Team, "Create invite link" doesn't name its department for screen readers, and two invites made on the same day get the same "Revoke" name.
- An HR officer moved to another department sees the old department name until the page reloads.
- The demo postings find categories and accommodation types by name. Seeding after an admin renamed a category or retired a type could leave a demo posting with no category, or with a retired type.
- Rare cases:
  - An accommodation's server error can point at the wrong item if the selection changed after saving.
  - An unknown status would show as Draft.
  - The API refuses Close if a closing date is sent with it.
- The high-contrast theme's red buttons need dark text; the theme can't be switched on yet.
- Phase 3: the public job page should get a slimmer posting shape than the employer one, which includes the employer's verification status.
- More automatic accessibility checks on the posting pages, and a few more permission tests (another company saving or changing a status, an admin opening a deleted posting).

