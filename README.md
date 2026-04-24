# Secure Bug and Issue Tracking System with IAM

Production-ready full-stack application with secure authentication, RBAC/permission enforcement, audit logging, and bug lifecycle management.

## Stack

- Backend: Node.js, Express, Prisma, PostgreSQL
- Frontend: React (Vite), Tailwind CSS
- Security: JWT access tokens, bcrypt, Helmet, rate limiting, Joi validation

## Core Capabilities

- Bug CRUD with assignment and status transitions (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
- Per-bug comments
- Search and filtering
- IAM:
  - Signup/Login
  - Role-based access (`ADMIN`, `DEVELOPER`, `TESTER`)
  - Permission enforcement per route
- Security dashboards:
  - Failed login insights
  - User activity logs
  - Audit trail for important actions
- Optional AI-style prioritization via keyword-based score logic

## Project Structure

```text
backend/
  prisma/
  src/
    config/
    controllers/
    middleware/
    routes/
    services/
    utils/
    validators/
frontend/
  src/
    components/
    context/
    pages/
    services/
    utils/
```

## Setup

### 1) Database

Create a PostgreSQL database, then configure connection:

- `backend/.env`
- `frontend/.env`

Or start PostgreSQL with Docker:

```bash
docker compose up -d
```

PostgreSQL is exposed on **host port `5433`** (not `5432`) so it does not clash with a local Postgres install. `backend/.env` uses `127.0.0.1:5433` in `DATABASE_URL`.

### Signup roles

Signup supports **TESTER**, **DEVELOPER**, and **ADMIN** only. **`SECURITY_TEAM` is not available on signup** — create those users via seed or direct DB/admin tooling.

**`SECURITY_TEAM`** is for security monitoring only (dashboard, audit logs, failed-login views). They do **not** get bug-tracker permissions. **ADMIN / DEVELOPER / TESTER** cannot access `/api/security/*`, `/api/audit/*`, or `/api/logs/*` (403).

Seeded security user: **`security@system.com`** / **`Security@123`**

For a real public deployment, tighten who can create **ADMIN** (e.g. invite-only or disable in signup).

### 2) Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
npm run dev
```

To **remove every user account** and related data (bugs, comments, audit logs), then restore only the seeded demo accounts:

```bash
npm run prisma:wipe-users
npm run prisma:seed
```

Backend runs on `http://localhost:5000`.

Default seeded accounts:
- **Admin:** `ashwinampily@gmail.com` / `Admin@123`
- **Developer (for bug workflow):** `developer@securebugs.local` / `Dev@12345`
- **Security team:** `security@system.com` / `Security@123`

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/bugs`
- `GET /api/bugs/:id`
- `POST /api/bugs`
- `PATCH /api/bugs/:id`
- `DELETE /api/bugs/:id`
- `POST /api/comments`
- `GET /api/users/me/activity` — own audit trail (any authenticated user)
- `GET /api/security/dashboard` — **SECURITY_TEAM only**
- `GET /api/security/audit-logs` — **SECURITY_TEAM only**
- `GET /api/audit/logs` — alias of audit-logs, **SECURITY_TEAM only**
- `GET /api/logs/failed-logins` — dashboard-style failed-login summary, **SECURITY_TEAM only**

## **The ADMIN and SECURITY_TEAM can't be added by the user like DEVELOPER and TESTER**
