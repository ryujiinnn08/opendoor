# OpenDoor

A web-based job matching platform with accommodation-based filtering and post-hire accommodation verification for persons with disabilities.

See [docs/CONCEPT_PLAN.md](docs/CONCEPT_PLAN.md) for the concept, architecture and build plan. Phase plans: [Phase 1](docs/PHASE_1_PLAN.md) (accounts and shared lists, done), [Phase 2](docs/PHASE_2_PLAN.md) (employers, teams and job postings, done).

## Structure

```
OpenDoor/
├── backend/    Laravel 12 REST API (Sanctum SPA cookie auth, MySQL/MariaDB)
├── frontend/   React 19 + Vite SPA (React Router, Axios, Tailwind CSS), deployed to Cloudflare Workers
└── docs/       Planning and project documentation
```

## Requirements

- **XAMPP** (Windows or macOS) for MySQL/MariaDB and phpMyAdmin. Its PHP 8.2 is enough to run the backend.
- **Composer** 2 (Windows: use the Composer-Setup.exe installer and point it at `C:\xampp\php\php.exe`)
- **Node.js 20+** and npm

`backend/composer.json` pins Composer's platform to PHP 8.2, so dependencies stay compatible with XAMPP's PHP even if your machine has a newer PHP.

## Local setup

Database: start **MySQL** in the XAMPP control panel, open http://localhost/phpmyadmin and create a database named `opendoor` (collation `utf8mb4_unicode_ci`). The defaults in `.env.example` (user `root`, empty password, port 3306) match XAMPP.

Backend (http://localhost:8000):

```bash
cd backend
composer install
cp .env.example .env     # Windows: copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=localhost --port=8000
```

`--seed` loads the job categories, the accommodation types, the starting accounts, the demo company and five sample job postings. It is safe to run `php artisan db:seed` again later; nothing is duplicated and no password is reset.

Frontend (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Both apps must run on `localhost` (not `127.0.0.1`) so the Sanctum session cookie is shared between them.

## Demo logins (local only)

When the `SEED_*` settings in `backend/.env` are left blank, the seeder creates these accounts:

| Role | Email | Password | What it shows |
|---|---|---|---|
| Administrator | `admin@opendoor.test` | `Admin_1234` | Employer verification, posting approvals, settings, shared lists |
| Job seeker | `candidate@opendoor.test` | `Demo_1234` | Candidate portal |
| Company owner | `employer@opendoor.test` | `Demo_1234` | Owner of the verified **OpenDoor Demo Corp.** (departments Human Resources and IT); sees and manages every department's job postings |
| HR officer | `hr@opendoor.test` | `Demo_1234` | HR officer in OpenDoor Demo Corp.'s Human Resources department; sees only that department's job postings |
| Individual employer | `individual@opendoor.test` | `Demo_1234` | Employer hiring for themselves (no departments), with one open job posting |

The five sample job postings: *HR Assistant* (open) and *Recruitment Coordinator* (waiting for approval) in Human Resources, *Junior Web Developer* (open) and *IT Support Specialist* (draft) in IT, and the individual employer's *Part-time Home-based Bookkeeper* (open). They are added only for employers that have no postings yet.

These defaults exist only outside production. On the live site the admin email and password must be set in the server's environment, and demo accounts are created only when `SEED_DEMO_PASSWORD` is set (see [docs/PHASE_1_PLAN.md §3.1](docs/PHASE_1_PLAN.md)). Running `php artisan db:seed` again never changes an account that already exists.

## Changing the OpenDoor logo

The header logo is a placeholder at `frontend/public/opendoor-logo.svg` (also used as the browser-tab icon). Save the real logo over that file with the same name. If the logo is a PNG, save it as `frontend/public/opendoor-logo.png` and change the two references to it: `frontend/src/components/layout/BrandLink.jsx` and `frontend/index.html`.

## Database notes (XAMPP / MariaDB)

XAMPP's MariaDB 10.4 automatically adds "update to the current time" to the first required `timestamp` column of a table. In migrations, use `dateTime()` (not `timestamp()`) for required date columns; nullable timestamps are fine.

## Tests

```bash
cd backend
php artisan test
```

```bash
cd frontend
npm run test
```

Backend tests use a temporary in-memory SQLite database, so they never touch your `opendoor` data. **Windows (XAMPP):** if they fail with a SQLite driver error, open `C:\xampp\php\php.ini`, find `;extension=pdo_sqlite` and remove the `;` at the start.

## Deployment

- Frontend: Cloudflare Workers static assets (`frontend/wrangler.jsonc`), built from GitHub with `VITE_API_URL=https://api.<domain>`.
- Backend + MySQL: Railway, served at `api.<domain>` through Cloudflare (SSL mode Full (strict)).

Details: [docs/CONCEPT_PLAN.md §5.6](docs/CONCEPT_PLAN.md).
