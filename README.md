# OpenDoor

A web-based job matching platform with accommodation-based filtering and post-hire accommodation verification for persons with disabilities.

See [docs/CONCEPT_PLAN.md](docs/CONCEPT_PLAN.md) for the concept, architecture and build plan.

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
php artisan migrate
php artisan serve --host=localhost --port=8000
```

Frontend (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The home page shows whether the API and database are reachable (`GET /api/health`).

Both apps must run on `localhost` (not `127.0.0.1`) so the Sanctum session cookie is shared between them.

## Deployment

- Frontend: Cloudflare Workers static assets (`frontend/wrangler.jsonc`), built from GitHub with `VITE_API_URL=https://api.<domain>`.
- Backend + MySQL: Railway, served at `api.<domain>` through Cloudflare (SSL mode Full (strict)).

Details: [docs/CONCEPT_PLAN.md §5.6](docs/CONCEPT_PLAN.md).
