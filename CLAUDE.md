# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full‑stack Student Housing platform connecting students with landlords.
- **Frontend**: Next.js 16 (App Router) with React 19 and Bootstrap 5.
- **Backend**: Express 5 REST API.
- **Database**: MySQL (Aiven) accessed via `mysql2/promise`.
- **Auth**: JWT stored in HTTP‑only cookies, role‑based access (Student, Landlord, Admin).

## High‑Level Architecture

### Backend (`backend/`)
- **Entry point**: `src/app.js` – loads env vars, creates a MySQL pool, registers routes, starts the HTTP server.
- **Database**: `src/config/database.js` – connection pool with SSL.
- **Routes**: `src/Routes/` – groups endpoint definitions (e.g., `userRoutes.js`, `listingRoutes.js`).
- **Controllers**: `src/controllers/` – business logic for each resource.
- **Middleware**: `src/middleware/` – JWT auth (`auth.js`), error handling, 404 handling.
- **Tests**: Jest tests live alongside controllers (`*.test.js`). They mock the DB pool and run offline.

### Frontend (`frontend/`)
- **Framework** – Next.js 16 App Router.
- **Entry point**: `src/app/page.tsx` – root layout.
- **Auth state** – `contexts/AuthContext.tsx` provides user info and JWT handling.
- **Form validation** – `react-hook-form` + `zod` schemas (`lib/validations.ts`).
- **UI components** – Bootstrap 5 utility classes + custom React components under `components/ui/`.
- **API client** – `lib/api.ts` wraps `fetch` for all backend calls.
- **Testing** – Jest + React Testing Library (`npm test`).

## Common Development Commands

### Backend (`cd backend`)
```bash
# Install dependencies (once)
npm install

# Start development server with auto‑reload
npm run dev

# Run the full test suite
npm test

# Run a single test file (e.g., auth controller)
npm test -- src/controllers/auth.test.js

# Run tests in watch mode (re‑run on changes)
npm test -- --watch

# Lint the code
npm run lint
```

### Frontend (`cd frontend`)
```bash
# Install dependencies (once)
npm install

# Start the Next.js dev server
npm run dev

# Build for production
npm run build

# Lint the code (ESLint)
npm run lint

# Run the full test suite (Jest)
npm test

# Run a single test (provide the path to the test file)
npm test -- path/to/test.file.tsx
```

### Root‑level Convenience Commands
```bash
# Run backend or frontend dev server from the repo root (choose folder first)
(cd backend && npm run dev)   # start backend
(cd frontend && npm run dev)  # start frontend

# Run all tests (both backend and frontend)
npm run test   # defined in root package.json if present; otherwise run manually per sub‑project
```

## Important Files & Entry Points
- `backend/src/app.js` – server bootstrap.
- `backend/src/config/database.js` – DB pool configuration.
- `backend/src/middleware/auth.js` – JWT verification and RBAC.
- `frontend/src/app/page.tsx` – Next.js root page.
- `frontend/lib/api.ts` – central API client.
- `frontend/lib/validations.ts` – Zod schemas for form validation.
- `frontend/middleware.ts` – server‑side route protection.

## Testing Guidance
- Backend tests mock the DB pool via `jest.unstable_mockModule('../config/database.js', ...)` and use `jest.spyOn` for `bcrypt`/`jwt`.
- Frontend tests use React Testing Library; they run in a Node environment and do not require a live API.
- Ensure the server is not running while executing Jest tests to avoid port conflicts.

## CI/CD Highlights
- GitHub Actions workflows live under `.github/workflows/` (backend‑ci.yml, frontend‑ci.yml, deploy.yml, etc.).
- All CI jobs use Node 20; lint, type‑check, and test steps mirror the local scripts above.
- Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`) build container images for deployment.

---
*Generated with Claude Code*