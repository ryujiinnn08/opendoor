# OpenDoor — Web Application Concept Plan

> Status: **DRAFT (rev. 2) — awaiting approval**
> Rev. 2 (2026-10-03): hosting moved from Vercel/Netlify to **Cloudflare** on the team's own domain (see §5.6, D6, D11, D12).
> Sources: *OpenDoor Revised Proposal* and *OpenDoor Modules and Features Specification*
> Purpose: turn the two papers into one buildable concept: what the app is, how it feels, how it is put together, and the order we build it in. Section 9 lists the gaps and contradictions found in the papers that need a decision before coding.

---

## 1. The concept in one paragraph

OpenDoor is a job board for Filipino persons with disabilities (PWDs) where **accommodations are first-class data instead of buried text**. A candidate ticks the accommodations they need once (e.g., wheelchair-accessible entrance, sign language interpreter, remote work). Every job posting declares the accommodations it provides from the same list. The app then ranks jobs by how many needs they meet ("Meets 4 of 5 of your needs — missing: Sign language interpreter"). After a candidate is hired, they confirm accommodation by accommodation whether the employer actually delivered. Those answers become an **anonymous trust score** on the employer, shown only after 3+ responses. In short: *match on needs, not diagnosis, then verify the promise.*

### The two differentiators (what the defense will hinge on)

| # | Differentiator | Answers | Where it lives |
|---|---|---|---|
| 1 | **Accommodation-based matching**: structured needs vs. structured offers, ranked by count met | SOP 1 | M2, M4, M5 |
| 2 | **Post-hire verification and trust score**: per-accommodation rating, anonymous, 3-response threshold | SOP 3 | M6, M7 |

Everything else (auth, dashboards, moderation, notifications) is there to support these two and make them credible.

---

## 2. Users and their single most important journey

| Role | "Golden path" (this must work end-to-end in the demo) |
|---|---|
| **PWD Job Seeker** | Register (consent) → set accommodation needs → see ranked matches → open a job → apply with an interview accommodation request → track status → get hired → rate each accommodation 30 days later |
| **Employer / HR** | Register → fill company profile + DTI/SEC no. → get verified → post a job with accommodations → admin approves → review applicant (auto "Reviewed") → mark Hired → watch trust score appear after 3 responses |
| **Administrator** | Verify employer → approve posting → handle a report / flagged feedback → manage accommodation list → read dashboard analytics |

These three paths double as the **usability-test tasks** (SUS evaluation) and the **live-demo script**.

---

## 3. Product structure

One React app, one Laravel API, one MySQL database, **four areas**, split by role after login.

```
   Browser ──► Cloudflare edge (DNS · SSL · CDN · WAF / rate limits · DDoS protection)
                 │                                         │
                 ▼  <domain>                               ▼  api.<domain>  (proxied CNAME)
   ┌──────────── React SPA ─────────────┐     ┌──────── Laravel REST API (Railway) ───────────────┐
   │ Cloudflare Workers static assets   │     │ auth:sanctum → role → Policy → FormRequest →       │
   │ Public │ /candidate │ /employer │   │────►│ Controller → Resource                              │
   │        /admin                      │     └───────┬───────────────────────────┬────────────────┘
   └────────────────────────────────────┘     ┌───────▼───────┐           ┌───────▼────────────────┐
     Axios, Sanctum SPA cookie session        │ MySQL 8       │           │ Cloudflare R2           │
     (same parent domain → same-site)         │ (Railway)     │           │ resumes, company logos  │
                                              └───────────────┘           └─────────────────────────┘
```

### 3.1 Sitemap (all pages, 35 total)

**Public (8):** Home · Browse jobs · Job details · Employer public page · Register · Login / Forgot password · Accessibility statement · Privacy notice

**Candidate (9):** Dashboard · My profile · Find jobs · Job details & apply · My applications · Accommodation feedback · Saved jobs · Notifications · Settings

**Employer (9):** Dashboard · Company & verification · My postings · Create/Edit posting · Applicants per posting · Applicant details · Trust score · Notifications · Settings

**Admin (9):** Dashboard & analytics · Employer verification · Posting moderation · Reported postings · Feedback moderation · Users · Categories · Accommodation types · Settings

### 3.2 How the portals hand data to each other

```
Employer creates posting ──► Admin approves ──► Public/Candidate browse & match
Candidate applies ──────────► Employer reviews ──► Hired / Rejected ──► Candidate notified
Hired + 30 days ────────────► Candidate rates accommodations ──► Trust score recalculated
                                                              └─► shown everywhere when ≥ 3
Admin verifies employer ────► Verified badge on employer page + every posting
Admin edits master lists ───► Every form, filter and picker updates
```

---

## 4. Experience and visual concept

Because the users are PWDs, **accessibility is the design language, not a layer on top of it.**

**Design principles**
1. **Calm and legible.** Generous spacing, 16–18 px base text, short line lengths, one primary action per screen.
2. **Never color alone.** Every status = icon + text + color (e.g., ✓ Hired, ✕ Rejected, ⏳ Pending).
3. **Predictable.** Same layout in every portal: top bar (logo, portal nav, bell, account), main content, no surprise pop-ups.
4. **Plain language.** "Meets 4 of 5 of your needs" rather than "80% match". "Not enough responses yet" rather than a blank score.
5. **Forgiving forms.** Visible labels, inline errors linked to fields and announced, no session time-out while typing, drafts where it matters (job postings).

**Visual direction (proposal, open to change)**
- Brand idea: an open door, i.e., warm and welcoming, not clinical.
- Palette (rev. 2026-10-05): **deep purple primary (#5b21b6)** + warm amber accent on a light lavender-white background; every text pair checked for ≥ 4.5:1 (primary 8.98:1 on white). A high-contrast theme (black/white/yellow focus) and a "larger text" toggle (M13 display settings).
- Type: one highly legible sans-serif (e.g., Atkinson Hyperlegible, designed for low-vision readers; free on Google Fonts).
- Thick, high-visibility focus ring on everything focusable; skip-to-content link on every page.
- Accommodation icons: one simple icon per accommodation *group* (physical, communication, work arrangement, assistive tech, support), always paired with the text label.

**Signature UI pieces**
- **JobCard + MatchBadge:** title, company, Verified badge, location/work setup, accommodation chips, and for candidates a badge such as `Meets 4 of 5 · Missing: Sign language interpreter`.
- **AccommodationPicker:** a grouped checklist used in three places (candidate needs, employer posting with per-item note, search filter). One component means one vocabulary.
- **TrustScoreCard:** `86% · based on 5 hires` with a per-accommodation breakdown (`Sign language interpreter: 1 of 3 delivered`), or "Not enough responses yet".
- **FeedbackForm:** one row per advertised accommodation with three large radio options (Delivered / Partially / Not delivered).

---

## 5. Technical architecture

### 5.1 Stack (from the papers, with concrete versions proposed)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **React 19 + Vite 8**, React Router 7, Axios | Hooks + Context as described in proposal §VIII |
| Styling | **Tailwind CSS 4** + design tokens (CSS variables) for themes | Makes high-contrast / large-text themes a variable swap |
| Accessible primitives | Hand-built for simple parts; **Radix UI** (or React Aria) for dialog/menu focus trapping | Avoids re-inventing focus traps |
| Backend | **Laravel 12** (PHP 8.2+, runs on XAMPP's PHP so Windows groupmates need no extra installs), Sanctum **SPA cookie** authentication (D11) | `JobPosting` model, not `Job` (reserved for queues) |
| Database | **MySQL 8** in production; XAMPP's **MariaDB 10.4** locally | Full-text index on postings. Migrations must stay compatible with both |
| Tests | Pest/PHPUnit feature tests; Vitest + Testing Library + `jest-axe`; Lighthouse/axe for audits | Proposal requires tests for policies, transitions, trust score |
| Edge & frontend hosting | **Cloudflare**: DNS for the team's domain, **Workers static assets** for the React build, proxy + SSL + WAF in front of the API | Replaces Vercel/Netlify. See §5.6 |
| API & database hosting | **Railway** (Laravel container + managed MySQL) behind `api.<domain>` | Cloudflare cannot run PHP or MySQL. See D6 |
| File storage | **Cloudflare R2** via Laravel's `s3` disk | Railway's disk is wiped on redeploy. See D12 |

### 5.2 Repository layout (monorepo)

```
OpenDoor/
├── backend/                 Laravel API
│   ├── app/Enums/           ApplicationStatus, PostingStatus, Role, Rating, ReportStatus
│   ├── app/Http/Controllers/{Auth,Candidate,Employer,Admin,Public}/
│   ├── app/Http/Requests/   FormRequests (validation)
│   ├── app/Http/Resources/  API Resources (role-aware field exposure)
│   ├── app/Policies/        JobPosting, Application, CandidateProfile, Feedback, Employer
│   ├── app/Services/        MatchingService, TrustScoreService
│   ├── app/Observers/       FeedbackObserver → recalculates trust score
│   ├── app/Notifications/   NewApplicant, StatusChanged, FeedbackOpen, …
│   ├── database/{migrations,seeders,factories}
│   └── Dockerfile           production image for Railway (PHP-FPM + Nginx, or FrankenPHP)
├── frontend/                React SPA
│   ├── wrangler.jsonc       Cloudflare deploy config (static assets, SPA fallback)
│   └── src/
│       ├── api/             axios instance + one module per resource
│       ├── auth/            AuthContext, ProtectedRoute
│       ├── components/      shared UI (JobCard, AccommodationPicker, StatusBadge, …)
│       ├── portals/{public,candidate,employer,admin}/   pages per portal
│       ├── hooks/           useDebounce, useQueryParams, useAnnounce
│       └── styles/          tokens, themes
└── docs/                    this plan, ERD, API reference, test reports
```

### 5.3 Security model (three gates on every request)

1. `auth:sanctum` checks for a valid session (401 → frontend clears AuthContext and goes to login).
2. `role:candidate|employer|admin` middleware checks the right portal (403).
3. Laravel **Policies** check that the record belongs to the user (403).

Plus: FormRequest validation (422 → messages shown beside fields), API Resources that strip fields per role (e.g., candidate needs only reach an employer through an application to its posting), login rate limit 5/min, suspended users blocked and their sessions ended, CORS locked to the frontend domain with credentials allowed, `APP_DEBUG=false` in production.

**How login works with Sanctum SPA cookies (D11).** The frontend (`<domain>`) and the API (`api.<domain>`) share a parent domain, so the browser treats them as the same site:
1. React calls `GET /sanctum/csrf-cookie`, and Laravel sets an `XSRF-TOKEN` cookie.
2. React posts to `/api/login`. Laravel starts a session in an **httpOnly, Secure, SameSite=Lax** cookie, scoped to `.<domain>`, and returns the user and role.
3. Axios runs with `withCredentials: true` and `withXSRFToken: true`, so every request carries the session plus a CSRF header. No token ever sits in `localStorage`, where an XSS bug could steal it.
4. Logout invalidates the session on the server. Suspension deletes the user's sessions (database session driver).

The rest of the security model (role middleware, Policies, FormRequests, Resources) is unchanged.

**Cloudflare adds an outer layer:** a WAF rate-limiting rule on `/api/login`, `/api/register` and `/forgot-password` (stops abuse before it reaches Railway), "Always Use HTTPS" + HSTS, and Bot Fight Mode. Optional: Cloudflare **Turnstile** on register/login. It is usually invisible and accessible, but it gets tested with NVDA before we keep it.

### 5.4 Core logic

**Matching (M5).** A single Eloquent query, not PHP loops:
```
JobPosting::visible()                       // open + approved + not past closes_at + not deleted
  ->withCount(['accommodations as needs_met' => fn($q) => $q->whereIn('accommodation_id', $needIds)])
  ->search($q)->inCategory($cat)->providing($extraFilters)
  ->orderByDesc('needs_met')->latest()->paginate(12);
```
The Resource adds `needs_total` and `missing[]` (needs minus provided) for the badge. Guests and candidates with no needs fall back to plain filtering.

**Status workflow (M6).** The `ApplicationStatus` enum owns `canTransitionTo($next, $actorRole)`, implementing proposal Table 1:

```
           ┌────────► Withdrawn (candidate, final)
           │               ▲
 (apply) ─► Pending ──open──► Reviewed ──► Hired (employer or candidate) ──► +30 days: feedback opens
                                   └─────► Rejected (employer, final)
```
Every transition fires a notification to the other party.

**Trust score (M7).** `FeedbackObserver` → `TrustScoreService::recalculate($employer)`:
`score = avg(item value) × 100` over all non-hidden feedback items, where Delivered = 1, Partial = 0.5, Not = 0. Store `trust_score` and `feedback_count` on `employers`; the API returns `null` while `feedback_count < 3`. The per-accommodation breakdown uses the same formula grouped by `accommodation_id`.

### 5.5 Data model (from proposal §X, with the additions recommended in §9)

```
users ─1:1─ candidate_profiles ─M:N─ accommodations (candidate_accommodation)
  │                │
  │                └─1:N─ applications ─1:1─ feedback ─1:N─ feedback_items ─N:1─ accommodations
  │                          │
  └─1:1─ employers ─1:N─ job_postings ─M:N─ accommodations (job_posting_accommodation + note)
                              │
                              ├─N:1─ categories
                              └─1:N─ reports (reporter → users)
notifications (Laravel built-in), saved_jobs (candidate_profile × job_posting)
```

Phase 2 refines the employer side: `employers` is the hiring party (company or individual), with `departments`, `employer_members` (owner / HR officer), `department_invites` and `app_settings` (see [PHASE_2_PLAN.md](PHASE_2_PLAN.md) §4.1).

### 5.6 Hosting on Cloudflare

| Cloudflare feature | What we use it for | Cost |
|---|---|---|
| **DNS** (the team's domain) | `<domain>` → frontend, `api.<domain>` → Railway (proxied CNAME) | Free |
| **Workers static assets** | Hosts the Vite build. Connected to GitHub (Workers Builds): every push to `main` deploys; every pull request gets its own preview URL. `not_found_handling: "single-page-application"` serves `index.html` for deep links like `/candidate/dashboard` | Free |
| **Proxy + SSL** | Edge certificates for both hostnames; SSL mode **Full (strict)** to Railway; HTTP/3; static assets cached at the edge | Free |
| **WAF / rate limiting / Bot Fight Mode** | Protects auth endpoints; blocks obvious bots | Free tier |
| **R2 object storage** | Resumes (private, served via short-lived signed URLs after a Policy check) and company logos (public bucket on `files.<domain>`) | Free up to 10 GB, no egress fees |
| **Web Analytics** | Cookieless page analytics. No consent banner needed, which fits the Data Privacy Act stance | Free |
| **Turnstile** *(optional)* | Bot check on register/login | Free |

**What stays off Cloudflare and why:** Laravel needs a PHP runtime (Workers run JS/WASM), and MySQL needs a real database (Cloudflare D1 is SQLite with no supported Laravel driver). Both run on **Railway**, reached only through `api.<domain>`.

**Environment settings (production):**
```
# backend (.env on Railway)
APP_URL=https://api.<domain>
FRONTEND_URL=https://<domain>
SESSION_DRIVER=database
SESSION_DOMAIN=.<domain>
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=<domain>
FILESYSTEM_DISK=r2                  # s3 driver pointed at R2's endpoint
TRUSTED_PROXIES=*                   # so Laravel sees real client IPs (CF-Connecting-IP) for rate limits/logs

# frontend (Workers build variables)
VITE_API_URL=https://api.<domain>
```

**Local development** mirrors production: `localhost:5173` (Vite) and `localhost:8000` (Laravel) are same-site, so cookie auth works locally without extra setup.

**Demo-day reliability:** the frontend never sleeps (edge-served). Railway's paid Hobby plan does not sleep either, so there are no cold starts. Its usage-based billing is roughly US$5/month at this traffic.

---

## 6. Build plan (follows the spec's 7 phases, with concrete exit checks)

| Phase | Scope | Exit check (demoable) |
|---|---|---|
| **0. Setup** | Monorepo, Laravel + Vite scaffolds, `.env` examples, lint/format, CORS + Sanctum stateful config, local MySQL, design tokens & base layout. **Deploy the skeleton early:** DNS records, Workers project linked to GitHub, Railway service + MySQL, `api.<domain>` with Full (strict) SSL | `https://<domain>` loads and shows a successful `GET /api/health` from `https://api.<domain>` |
| **1. Foundation** | M1 auth (register + consent, login, logout, role redirect, ProtectedRoute, 3-gate backend), M11 master data + seeders (≈10 categories, RA 7277 accommodation list, admin, demo users), AppLayout / PortalNav / skip link / focus-on-route-change | Each role logs in and lands in its own empty portal; wrong-role URLs redirect |
| **2. Employer side** | M3 company profile (+ verification submit), M4 posting CRUD with AccommodationPicker + notes, draft → pending → open, close/reopen, soft delete | Employer creates, edits, closes a posting with accommodations |
| **3. Candidate side** | M2 profile + needs (+ optional private disability type), M5 search / category / accommodation filters / match mode / sort / pagination / URL-synced filters / live result count | Candidate sees jobs ranked "Meets X of Y" with missing items named |
| **4. Applications** | M6 apply (+ cover note, interview request), list, withdraw, employer review (auto-Reviewed), hire/reject, candidate confirm-hire, enforced transitions | One application walked through every legal status; illegal ones rejected by the API |
| **5. Verification** | M7 feedback form (30-day gate), items, observer, trust score, threshold, breakdown, TrustScoreCard everywhere | Seeded hires produce a visible score after the 3rd response |
| **6. Administration** | M10 verification queue, posting approval, reports, feedback hiding, user suspend/reactivate, create admins; M8 three dashboards + analytics; M9 in-app notifications + bell | Admin runs the full moderation loop; users see notifications |
| **7. Extras & release** | M12 saved jobs, resume upload to R2, display settings, forgot password; WCAG audit (axe, Lighthouse, NVDA, keyboard); WAF rules, Web Analytics, production seed data; SUS testing | Live URLs on the team's domain, audit report, demo script passes on production |

Because the skeleton is deployed in Phase 0, every later phase ships to production continuously. "Deploy" is never a last-week surprise.

**Priority guard:** if time runs short, Phases 1–5 plus the Must-have parts of 6 are enough to answer all five SOPs. Should-have and Could-have items are cut in reverse order.

---

## 7. Testing and evaluation

- **Backend feature tests (required by the proposal):** policy denials per role, every allowed and forbidden status transition, one-application-per-posting, feedback only once and only when Hired + 30 days, trust score math (including the hidden-feedback recalculation and the 3-response threshold), matching order.
- **Frontend:** component tests for AccommodationPicker, MatchBadge, StatusBadge, FeedbackForm; `jest-axe` on every page component.
- **Accessibility audit:** Lighthouse + axe per page, keyboard-only walkthrough, NVDA pass on the three golden paths, 200% zoom and 360 px width checks.
- **Usability:** 5+ PWD and 3+ employer participants on the deployed app, recording task success and SUS (target mean ≥ 68).

---

## 8. Demo / seed data concept

The seeder should tell a story on its own:
- 1 admin; ~3 verified employers + 1 pending verification; ~15 open postings spread across categories and accommodation groups.
- 1 demo candidate with 5 needs, so the match list visibly shows full, partial, and zero matches.
- One employer with **5 completed feedbacks** (score visible, mixed breakdown), one with **2** (shows "Not enough responses yet").
- One application per status, plus one "Hired 31 days ago" so the feedback form is open during the demo.

---

## 9. Gaps and contradictions in the papers (need your decision)

| # | Issue found | Recommendation |
|---|---|---|
| **D1** | `job_postings.status` is `draft/open/closed` + `is_approved`, but the UI lists **"pending approval"** and admin **"rejected with reason"**. | Use one status enum: `draft → pending → open → closed`, plus `rejected`; add `rejection_reason`. Drop `is_approved`. |
| **D2** | Verification **"unlocks posting for employers"** (spec §1.3), yet verification is only **Should have**. | Posting does not require verification. Unverified employers can post (still admin-approved) but have no badge. Keeps Must-haves independent. |
| **D3** | The **30-day feedback window** cannot be shown live in a demo. | Make it a config value (`FEEDBACK_DELAY_DAYS=30`) and seed back-dated hires. |
| **D4** | **"Flagged feedback"** is moderated, but nothing defines *who* flags it. | Feedback with a comment is auto-flagged for admin review before the comment shows (ratings count immediately). Simple and defensible. |
| **D5** | Several needed columns are missing from the schema: employer verification rejection reason, posting rejection reason, `accommodations.is_active` (retire), user display preferences, `reports.status` values, `employers.logo_path`, `description`. | Add them in migrations (listed in §5.5). |
| **D6** | Hosting (rev. 2): the proposal names Vercel/Netlify + Railway or Render/Aiven. The team owns a domain on Cloudflare. | **Cloudflare** for DNS, frontend, edge security and file storage; **Railway** for Laravel + MySQL (~US$5/mo). Fallbacks for the API: Render + Aiven (free, cold starts) or a small VPS behind a Cloudflare Tunnel. The proposal's §XI deployment text should be updated to match. |
| **D7** | No scheduler is guaranteed on free hosting, but auto-close (F4.6) and the "feedback open" notification (F7.6) imply cron. | Compute both lazily: `closes_at` checked in the `visible()` scope; the feedback reminder is generated when the candidate loads the dashboard or notifications. No cron needed. |
| **D8** | A candidate can only confirm a hire from **Reviewed**. If the employer never opens the application, the candidate is stuck at Pending. | Keep as specified (matches Table 1), but show the hint "Ask the employer to update your status". Or allow Pending → Hired by the candidate. Your call. |
| **D9** | `show_disability`: visible to whom when true? | Only to employers the candidate applied to. Never public, never used in matching. |
| **D10** | Styling library not specified. | Tailwind + Radix (see §5.1). |
| **D11** | The proposal specifies Sanctum **Bearer tokens** (needed when the frontend and API were on unrelated domains, e.g. `vercel.app` + `railway.app`). On one Cloudflare domain this is no longer needed. | Switch to **Sanctum SPA cookie auth** (§5.3): httpOnly session, CSRF-protected, no token in the browser. Still "Laravel Sanctum", so the objective's wording holds; proposal §VIII/§IX wording changes from "Bearer header" to "session cookie". |
| **D12** | Resume upload and company logos need storage, but Railway containers lose local files on every redeploy. | Store files on **Cloudflare R2** through Laravel's S3 driver; private resumes served via signed URLs. |

---

## 10. What happens after approval

1. Lock decisions D1–D12 (your answers or my recommendations).
2. Write the detailed implementation plan for **Phase 0 + Phase 1** (files, migrations, endpoints, tests) for a second review.
3. Scaffold `backend/` and `frontend/` in this folder and start building phase by phase, with a demoable checkpoint at the end of each phase.
