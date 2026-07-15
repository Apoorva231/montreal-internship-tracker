# Montreal Internship Tracker

A portfolio-ready full stack app for managing SWE internship applications across Montreal and Canada. It uses React, TypeScript, Node.js, Express, JWT auth, PostgreSQL, Prisma, and Zod.

The product angle is intentionally practical: a candidate can track target companies, application status, deadlines, notes, and follow-up tasks in one authenticated workspace. It gives interviewers a clear full stack story without needing a contrived domain.

## Tech Stack

- Frontend: React 19, Vite, TypeScript, lucide-react
- Backend: Node.js, Express, TypeScript
- Auth: JWT access tokens, bcrypt password hashing
- Validation: Zod, including explicit password complexity validation
- Database: PostgreSQL
- ORM: Prisma
- Local infra: Docker Compose for Postgres

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Start Postgres:

```bash
docker compose up -d
```

3. Configure the API:

```bash
cp apps/api/.env.example apps/api/.env
```

4. Run Prisma migrations and seed demo data:

```bash
pnpm db:migrate
pnpm db:seed
```

5. Start both apps:

```bash
pnpm dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:4000/api`

Demo login:

- Email: `demo@interntracker.dev`
- Password: `DemoPassword123!`

## Deploying as a Service

This repo includes `render.yaml`, a Render Blueprint that deploys the app as one public Node web service plus one managed Postgres database.

Production shape:

- Render Web Service: builds both workspaces, runs Prisma migrations, starts the Express API, and serves the React build.
- Render Postgres: provides `DATABASE_URL` to the service.
- Public URL: `https://montreal-internship-tracker.onrender.com` unless you rename the Render service.

Steps:

1. Push this repository to GitHub.
2. In Render, choose **New +** > **Blueprint**.
3. Connect the GitHub repository.
4. Render reads `render.yaml` and creates the web service and database.
5. After the first deploy, open the service URL and create a real account.

Render generates `JWT_SECRET` automatically. `DATABASE_URL` is injected from the managed Postgres database. The app runs `prisma migrate deploy` before each production deploy.

If you rename the Render service, update `CLIENT_ORIGIN` in `render.yaml` to match the generated `onrender.com` URL.

## Design Doc

### Problem

SWE internship searches are high-volume and easy to lose track of. A student applying in Montreal or across Canada needs more than a spreadsheet once interviews, deadlines, recruiter contacts, and follow-ups overlap.

### Product Scope

The first version focuses on the workflow that matters most:

- Register and sign in securely.
- Add companies and internship applications.
- Track status across saved, applied, interview, technical, offer, rejected, and archived.
- Prioritize opportunities.
- Record deadlines, job URLs, notes, and follow-up tasks.
- View a compact dashboard with active opportunities, interviews, offers, and upcoming tasks.

### Architecture

The repo is an npm workspace with two apps:

- `apps/api`: Express API with Prisma and PostgreSQL.
- `apps/web`: React/Vite frontend with a typed API client.

This split keeps the frontend and backend independently understandable while still being simple enough for a portfolio reviewer to run locally.

### Backend Choices

Express was chosen because it is familiar, lightweight, and easy to inspect during interviews. The API uses route modules for auth, companies, applications, and tasks so the codebase can grow without a heavy framework.

JWT is used for stateless auth. The token includes only the user id and email, and protected routes derive ownership from the token. Passwords are hashed with bcrypt before storage.

Zod validates request payloads at the boundary. Password validation is explicit:

- Minimum 10 characters
- Maximum 72 characters
- Lowercase letter
- Uppercase letter
- Number
- Symbol

The 72 character max matches bcrypt's practical input limit and avoids misleading users into thinking extra password characters are always used by the hash.

### Database Choices

PostgreSQL is the production-minded choice because it is widely used, works well with Prisma, and gives room for future features like analytics, reminders, and search.

Core models:

- `User`: owns applications.
- `Company`: reusable company records with location and industry.
- `Application`: role, status, priority, deadline, contacts, notes.
- `Task`: follow-up items attached to applications.

Applications belong to users, and tasks cascade when an application is deleted. Companies are shared records keyed by name and location, which avoids duplicate company rows for common targets while allowing remote or city-specific entries.

### Frontend Choices

The UI is a working app, not a landing page. Recruiters can sign in, see the dashboard, create an application, filter by status, update status, and manage follow-up tasks.

Design choices:

- Compact dashboard layout for scanning many roles quickly.
- Left rail for creation and upcoming tasks.
- Main panel for search, status filters, funnel counts, and application cards.
- Icons only where they improve command recognition.
- Responsive layout that collapses to one column on smaller screens.

### Tradeoffs

JWT without refresh tokens keeps the app easier to run and review, but a production app should add refresh token rotation, token revocation, and stronger session controls.

The frontend stores the JWT in localStorage for simplicity. That is acceptable for a portfolio demo, but a production app should consider httpOnly secure cookies with CSRF protections.

Company records are shared globally. This is useful for avoiding duplicates, but private per-user company notes would need a separate model.

The API has focused validation and ownership checks, but it does not yet include rate limiting, audit logs, or automated tests. Those would be good next steps before production deployment.

### API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/companies`
- `GET /api/applications`
- `GET /api/applications/insights`
- `POST /api/applications`
- `PATCH /api/applications/:id`
- `DELETE /api/applications/:id`
- `POST /api/applications/:applicationId/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`

### Future Improvements

- Add Vitest and Supertest coverage for auth and application ownership.
- Add resume version tracking per application.
- Add reminders through email or calendar integration.
- Add recruiter contact management.
- Add deployment config for Render, Fly.io, Railway, or AWS.
- Add CSV import from an existing spreadsheet.
