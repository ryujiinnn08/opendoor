# Phase 1 Plan: Foundation

> Status: **Built (2026-10-03).** All six demo steps verified in the browser; 43 backend and 28 frontend tests pass.
> The seeded admin and demo accounts are a **backup** for demos (e.g., if registration fails on the day). Registration itself must still work and is covered by tests and demo steps 1–2.
> Part of: [CONCEPT_PLAN.md](CONCEPT_PLAN.md), build phase 1 of 7

---

## 1. What Phase 1 delivers

At the end of Phase 1, OpenDoor has **working accounts and the shared lists**. Nothing about jobs yet. This is the base every later phase builds on.

**You will be able to:**
- **Register** as a job seeker or an employer (with the required privacy consent).
- **Log in and out.** After login, each person lands in their own portal: Candidate, Employer or Admin.
- **Stay logged in** when you refresh the page.
- **Be blocked from other portals.** A job seeker who types an admin address is sent back to their own dashboard.
- **As admin, manage the shared lists:** job categories (e.g., "Healthcare") and accommodation types (e.g., "Wheelchair-accessible entrance").

**Everything is usable with the keyboard alone**, with clear labels and error messages that screen readers can read out.

---

## 2. How we'll know it's done

We demo these six things. If all six work, Phase 1 is finished.

| # | Demo step | Expected result |
|---|---|---|
| 1 | Register as a job seeker | Lands on the Candidate dashboard |
| 2 | Register as an employer | Lands on the Employer dashboard |
| 3 | Log in as the admin, add a category, retire an accommodation type | The changes show in the admin lists; the retired type no longer appears to other users |
| 4 | As a job seeker, type `/admin/categories` in the address bar | Sent back to the Candidate dashboard |
| 5 | Refresh the page, then log out | Still logged in after refresh; fully logged out after clicking Log out |
| 6 | Repeat steps 1–5 using only the keyboard | Everything works |

---

## 3. Decisions

**All eight approved on 2026-10-03.** Decision 3 is explained in §3.1, and decision 4 was made stricter at your request.

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | The proposal calls one database column `group`. `GROUP` is a reserved word in MySQL and causes errors in raw SQL and phpMyAdmin queries. Rename it? | **Yes, call it `group_name`** | Avoids confusing errors for the whole team |
| 2 | Build the admin screens for categories and accommodation types now (instead of Phase 6)? | **Yes, now** | They're small and required. They also give us real admin pages to test the "blocked from other portals" rule |
| 3 | Where do the admin and demo account passwords come from? | **From each person's `.env` file** (details in §3.1) | Keeps passwords out of the code that goes to GitHub |
| 4 | Password rule? | **At least 8 characters, with an uppercase letter, a lowercase letter, a number and a special character** (details in §3.2) | Stronger passwords, as requested |
| 5 | Log new users in right after they register? | **Yes** | One less step for users |
| 6 | How long before an idle user is logged out? | **8 hours** (Laravel's default is 2) | The proposal says users must not be logged out while filling in forms |
| 7 | Leave "Forgot password" and "Change password" for later? | **Yes**: change password in Phase 6, forgot password in Phase 7 | Not needed for Phase 1's goal; keeps the phase small |
| 8 | Make a first git commit of the current setup before starting? | **Yes** | Gives us a clean starting point we can return to |

### 3.1 Decision 3 explained: starting accounts and their passwords

**Why we need starting accounts at all**
- **The admin can't register.** For security, the Register page only offers "job seeker" and "employer". The first admin account therefore has to be created another way. A **seeder** (a script that fills the database with starting data) does it.
- **Demo accounts save time.** Without them, every time someone resets their database they would have to register a new job seeker and employer by hand to test anything. The seeder creates one of each.

**Where the passwords live**

Each person's `backend/.env` file gets three new settings:

```
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_DEMO_PASSWORD=
```

When someone runs `php artisan db:seed`, the seeder reads these settings and creates the accounts. The password is stored **hashed** (scrambled one way), never as plain text, exactly like a password typed on the Register page.

**Why not just write the passwords in the code?**
The code goes to GitHub and is shared with the whole group, and possibly the panel. If the admin password were written in the seeder, anyone reading the code would know the admin password of the **live site**. The `.env` file is never uploaded (git ignores it), so each computer and the live server keep their own secrets.

**What happens in each situation**

| Situation | Admin account | Demo job seeker + employer |
|---|---|---|
| **Your laptop or a groupmate's** (`APP_ENV=local`), settings left blank | Created with a default: `admin@opendoor.test` / `OpenDoor@2026` | Created: `candidate@opendoor.test` and `employer@opendoor.test`, same default password |
| **Your laptop**, settings filled in | Created with your email and password | Created with your demo password |
| **Live site** (`APP_ENV=production` on Railway), settings filled in | Created with the email and password set on Railway | Created **only if** `SEED_DEMO_PASSWORD` is set. We will set it before the defense so the panel can log in as each role |
| **Live site**, admin settings missing | **Seeding stops** with the message "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding production." | Not created |

So the simple defaults exist **only on local computers**. The live site can never end up with a guessable admin password.

**Other details**
- The `.test` email ending is reserved for testing and can never belong to a real person, so no real inbox is ever involved.
- The default password `OpenDoor@2026` follows the password rule in §3.2.
- **Running the seeder again never resets a password.** If an account already exists, the seeder leaves it alone. Someone who changed the admin password keeps it.
- The README will list the default local logins so groupmates can sign in right after setup.

### 3.2 Decision 4 explained: the password rule

A password must have **all** of the following:
- at least **8 characters**
- at least one **uppercase letter** (A–Z)
- at least one **lowercase letter** (a–z)
- at least one **number** (0–9)
- at least one **special character**, such as `! @ # $ % ? * -`

Because OpenDoor's users include people with cognitive, visual or motor disabilities, the Register page makes the rule easy to meet:
- **A live checklist** under the password field. Each requirement turns to "✓ Met" as the user types, shown with text and an icon, not just color, and read out by screen readers.
- **A "Show password" button**, so users can check what they typed instead of typing it twice blind.
- **Pasting and password managers are allowed.** The field never blocks paste, so users can use a password manager to generate and fill strong passwords.
- **Errors in plain language**, e.g., "Add a special character, such as ! or @."

The server enforces the same rule. Someone who skips the React page and sends a weak password straight to the API is still refused.

---

## 4. What gets built

### 4.1 Database changes

| Table | What changes |
|---|---|
| `users` (exists) | Add three columns: **role** (candidate, employer or admin), **is_active** (false means suspended) and **consented_at** (when the user accepted the privacy notice) |
| `categories` (new) | Job categories. Each name must be unique |
| `accommodations` (new) | Accommodation types, each with a **name**, a **group_name** (e.g., "Physical access"), an optional description, and **is_active**. A retired type is hidden from forms but never deleted, so old job postings and feedback that use it stay correct |

**Starting data**, loaded with one command (`php artisan db:seed`):
- **10 job categories:** Information Technology, Customer Service & BPO, Administrative & Clerical, Accounting & Finance, Sales & Marketing, Education & Training, Healthcare, Hospitality & Food Service, Manufacturing & Production, Creative & Design.
- **18 accommodation types in 5 groups**, taken from the proposal (Physical access, Communication, Work arrangement, Assistive technology, Support).
- **1 admin account**, plus **1 demo job seeker and 1 demo employer** (see §3.1 for when each is created).

### 4.2 How login works

1. The browser asks Laravel for a security cookie (protects against forged requests).
2. The user submits email and password.
3. Laravel checks them and starts a **session**. The session is stored in a cookie that JavaScript cannot read, so it can't be stolen by a malicious script.
4. Laravel replies with the user's name and role, and React opens the matching portal.
5. On every page refresh, React asks Laravel "who is logged in?" so the user stays logged in.
6. **Log out** ends the session on the server, not just in the browser.

**Safety rules:**
- **Strong passwords:** 8+ characters with uppercase, lowercase, a number and a special character (§3.2).
- **Only 5 login attempts per minute** per email address, to slow down password guessing.
- **Suspended accounts** can't log in, and anyone already logged in is logged out on their next click.
- **Nobody can register as an admin.** Admin accounts come only from the seeder (or, later, from another admin).

### 4.3 Who can open what

Every request to the server is checked in two steps (a third step arrives in Phase 2):

| Check | Question it answers | If it fails |
|---|---|---|
| 1. Logged in? | Does this request have a valid session? | Sent to the login page |
| 2. Right portal? | Is this a candidate on candidate pages, an admin on admin pages, and so on? | Refused, and the user is sent to their own dashboard |
| *3. Owns the record? (Phase 2)* | *Is this employer editing their own job posting?* | *Refused* |

React applies the same rules to page addresses so users never see a page they can't use. **The server checks are the real protection**: even if someone bypasses React, the server still refuses.

### 4.4 Pages

**Public (anyone):**

| Page | What's on it |
|---|---|
| Home | What OpenDoor does, with "Register as job seeker" and "Register as employer" buttons |
| Register | Choose "I'm looking for a job" or "I'm hiring"; name, email, password with a live rule checklist and "Show password"; privacy consent checkbox |
| Log in | Email, password, a "show password" option, clear messages for wrong details or too many attempts |
| Privacy notice | **Draft** text on what data is collected, why, and how to request deletion (Data Privacy Act). The group should review it |
| Accessibility statement | **Draft** text on our accessibility goal and how to report a problem |

**Portals (after login):**

| Page | What's on it |
|---|---|
| Candidate / Employer / Admin dashboard | "Welcome, {name}" and placeholder boxes. Real content comes in Phase 6 |
| Admin › Categories | List of categories; add, rename, delete (asks for confirmation first) |
| Admin › Accommodation types | List grouped by group; add, edit, retire or restore (asks for confirmation first) |

Each portal has its own menu, shows the user's name and has a **Log out** button.

### 4.5 Reusable building blocks

These are built once now and reused on every later page, so accessibility is consistent everywhere.

| Building block | What it does for users |
|---|---|
| Form field | Every input has a visible label. Errors appear right under the field and are read out by screen readers |
| Password field | "Show password" button and a live checklist of the password rules (§3.2) |
| Error summary | After a failed submit, a box at the top lists every problem; each one links to its field |
| Confirm dialog | "Are you sure?" pop-up. Keyboard focus stays inside it, Escape closes it, and focus returns to where the user was |
| Status badge | Shows status with **an icon and text**, never color alone (e.g., "✓ Active", "⊘ Retired") |
| Announcer | Reads out short messages such as "Category added" to screen-reader users |

### 4.6 Tests

Automatic tests check the rules so we don't break them later without noticing.

**Server tests:**
- Registering works for job seekers and employers, and is refused for "admin", missing consent, or an email already in use.
- Weak passwords are refused: too short, or missing an uppercase letter, lowercase letter, number or special character.
- Seeding: the live site refuses to seed without admin settings; demo accounts are skipped on the live site unless `SEED_DEMO_PASSWORD` is set; re-seeding never resets an existing password.
- Logging in works; wrong passwords are refused; suspended users are refused; the 6th attempt in a minute is blocked.
- Logging out ends the session.
- Job seekers and employers are refused on every admin address; admins are allowed.
- Retired accommodation types disappear from public lists but stay in the admin list.
- Loading the starting data twice doesn't create duplicates.

**Page tests:**
- Form fields and error summaries pass automatic accessibility checks.
- The address-bar protection sends each user to the right place.
- Login shows Laravel's error messages next to the right field.
- The password checklist marks each rule as met while typing.

The server tests use a temporary database that is thrown away afterwards, so they never touch anyone's real `opendoor` data.

---

## 5. Order of work

| Step | Work | Done when |
|---|---|---|
| 1 | First git commit of the current setup | Saved starting point exists |
| 2 | Database changes and starting data | Tables and data visible in phpMyAdmin |
| 3 | Login, register, logout, and the access checks, with tests | Server tests pass |
| 4 | Server side of categories and accommodation types, with tests | All server tests pass |
| 5 | Reusable building blocks, with tests | Page tests pass |
| 6 | Register and Login pages, portal layouts, address-bar protection | Can register and log in as each role in the browser |
| 7 | Admin list pages, public info pages, dashboards | The six demo steps in §2 work |
| 8 | Keyboard and screen-reader check; update the README | Phase 1 finished |

---

## 6. Not in Phase 1

| Feature | Comes in |
|---|---|
| Company profile and job postings | Phase 2 |
| Candidate profile, job search and matching | Phase 3 |
| Admin screen to suspend users (the suspension rule itself is built now) | Phase 6 |
| Notifications, settings, change password | Phase 6 |
| Forgot password | Phase 7 |
| Putting the site online (Cloudflare + Railway) | Separate step, once you confirm the domain |

---

## 7. For groupmates: running it after Phase 1

```bash
cd backend
composer install
php artisan migrate --seed
php artisan test
```

```bash
cd frontend
npm install
npm run test
npm run dev
```

**Windows (XAMPP) note:** if the server tests complain about SQLite, open `C:\xampp\php\php.ini`, find `;extension=pdo_sqlite`, and delete the `;` at the start.

---

## Appendix: technical reference

For whoever writes the code. Everything above, in developer terms.

### A. Server addresses (API endpoints)

| Method | Address | Who can use it | Purpose |
|---|---|---|---|
| GET | `/sanctum/csrf-cookie` | Anyone | Sets the security cookie |
| POST | `/api/register` | Guests | Create account (`name`, `email`, `password`, `password_confirmation`, `role`, `consent`) and log in |
| POST | `/api/login` | Guests | Log in (5 per minute per email + IP) |
| POST | `/api/logout` | Logged in | Log out |
| GET | `/api/me` | Logged in | Current user |
| GET | `/api/categories` | Anyone | Category list |
| GET | `/api/accommodations` | Anyone | Active accommodation types, grouped |
| GET | `/api/admin/accommodations` | Admin | All types, including retired |
| POST, PUT, DELETE | `/api/admin/categories/{id}` | Admin | Add, rename, delete a category (the "only if unused" check is added in Phase 2) |
| POST, PUT | `/api/admin/accommodations/{id}` | Admin | Add, edit a type |
| PATCH | `/api/admin/accommodations/{id}/status` | Admin | Retire or restore a type |

### B. Main files

**Backend (`backend/`)**
- Migrations: `add_opendoor_columns_to_users_table`, `create_categories_table`, `create_accommodations_table`
- Enums: `Role` (candidate / employer / admin), `AccommodationGroup` (the 5 groups)
- Models: `User` (updated), `Category`, `Accommodation`
- Middleware: `EnsureUserHasRole` (`role:admin`), `EnsureUserIsActive` (`active`)
- Form requests: `RegisterRequest`, `LoginRequest`, `CategoryRequest`, `AccommodationRequest`
- API resources: `UserResource`, `CategoryResource`, `AccommodationResource` (never return password fields)
- Seeders: `CategorySeeder`, `AccommodationSeeder` (`updateOrCreate`); `UserSeeder` (`firstOrCreate`, so existing passwords are never reset; fails in production without `SEED_ADMIN_*`; demo users in production only when `SEED_DEMO_PASSWORD` is set)
- Password rule: `Password::min(8)->mixedCase()->numbers()->symbols()`, set once with `Password::defaults()` in `AppServiceProvider`
- New `.env.example` keys: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO_PASSWORD`, `SESSION_LIFETIME=480`

**Frontend (`frontend/src/`)**
- `api/auth.js`; `api/client.js` updated to handle 401 (go to login), 419 (refresh security cookie, retry once) and 422 (field errors)
- `auth/AuthContext.jsx`, `auth/ProtectedRoute.jsx`, `auth/GuestRoute.jsx`, `auth/redirects.js` (`safeNext()` only allows internal paths, which prevents redirects to outside sites)
- Layouts: `PublicLayout`, `PortalLayout` + `portalMenus.js`
- Components: `FormField`, `CheckboxField`, `PasswordField` (show/hide + live rule checklist), `ErrorSummary`, `Button`, `Modal` + `ConfirmDialog` (Radix Dialog; focus starts on Cancel and returns to the opener), `StatusBadge`, `Notice`, `DashboardTile`, `PageHeading`, `AnnouncerProvider` + `useAnnounce`
- New packages: `@radix-ui/react-dialog`; for tests `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`
