# OpenDoor

A web-based job matching platform with accommodation-based filtering and post-hire accommodation verification for persons with disabilities.

See [docs/CONCEPT_PLAN.md](docs/CONCEPT_PLAN.md) for the concept, architecture and build plan, and [docs/PHASE_1_PLAN.md](docs/PHASE_1_PLAN.md) for the current phase.

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

`--seed` loads the job categories, the accommodation types and the starting accounts. It is safe to run `php artisan db:seed` again later; nothing is duplicated and no password is reset.

Frontend (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Both apps must run on `localhost` (not `127.0.0.1`) so the Sanctum session cookie is shared between them.

## Demo logins (local only)

When the `SEED_*` settings in `backend/.env` are left blank, the seeder creates these accounts:

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@opendoor.test` | `OpenDoor@2026` |
| Job seeker | `candidate@opendoor.test` | `OpenDoor@2026` |
| Employer | `employer@opendoor.test` | `OpenDoor@2026` |

These defaults exist only outside production. On the live site the admin email and password must be set in the server's environment, and demo accounts are created only when `SEED_DEMO_PASSWORD` is set (see [docs/PHASE_1_PLAN.md §3.1](docs/PHASE_1_PLAN.md)).

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
