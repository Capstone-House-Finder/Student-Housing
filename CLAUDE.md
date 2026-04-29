# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full‑stack house‑rental platform:
- **Frontend** – Next.js 16 application where landlords create and manage listings.
- **Backend** – Express.js API handling listings, user authentication (JWT), and file uploads.
- **Database** – MySQL (Aiven) storing users, listings, amenities, and photos.

## High‑Level Architecture

### Backend (`backend/`)
- **Entry point** – `src/app.js` loads environment variables, creates the DB pool (`src/config/database.js`), registers routes, and starts the HTTP server.
- **Routes** – `src/Routes/` groups REST endpoints (e.g., `userRoutes.js`, `listingRoutes.js`).
- **Controllers** – `src/controllers/` contain the business logic for each resource (user registration/login, listing CRUD, amenities, photos).
- **Middleware** – `src/middleware/` provides JWT authentication (`auth.js`), error handling, and 404 handling.
- **Config** – `src/config/database.js` builds a MySQL connection pool with SSL support and sensible timeouts.
- **Tests** – Jest unit tests live beside each controller (`*.test.js`). Tests mock the DB pool and external libs to run offline.

### Frontend (`frontend/`)
- **Entry point** – `src/app/page.tsx` (Next.js app root).
- **Pages** – `/landlord/listings/create/` implements a multi‑step wizard (Details → Amenities → Photos → Review).
- **State** – Custom hook `useCreateListing` orchestrates form state and API calls.
- **Styling** – CSS modules + inline styles.
- **Testing** – Jest + React Testing Library (`npm test`).

## Development Workflow

### Backend
```bash
# Install deps (run once)
cd backend && npm install

# Start dev server with auto‑reload
npm run dev

# Run all tests
npm test

# Run a single test file (e.g., auth controller)
npm test -- src/controllers/auth.test.js

# Run tests in watch mode (re‑run on changes)
npm test -- --watch
```

### Frontend
```bash
# Install deps (run once)
cd frontend && npm install

# Start dev server (Next.js)
npm run dev

# Build for production
npm run build

# Lint the code
npm run lint

# Run all tests
npm test

# Run a single test (Jest)
npm test -- path/to/test.file.tsx
```

### Common Commands
- **`npm run dev`** – Starts the appropriate dev server (backend or frontend, depending on the current folder).
- **`npm run lint`** – Executes ESLint (frontend) or `eslint` (backend) based on the project scripts.
- **`npm run test`** – Runs Jest; use `--` to pass Jest flags (e.g., `--watch`).
- **Environment** – Backend reads a `.env` file at the repository root (`backend/.env` is not used). Required vars: `DATABASE_URL`, `JWT_SECRET`, `PORT`, etc.

## Testing Guidance
- Tests mock the DB pool via `jest.unstable_mockModule('../config/database.js', ...)` and use `jest.spyOn` for `bcrypt`/`jwt`.
- All controller tests are self‑contained; they do **not** require a live MySQL instance.
- Ensure the backend server is not running while running tests to avoid port conflicts.

## Important Files
- `backend/src/config/database.js` – Connection pool with SSL cert (`certs/ca.pem`) and timeouts.
- `backend/src/controllers/userController.js` – Registration, login, profile endpoints.
- `backend/src/Routes/userRoutes.js` – Public `/register` and `/login` routes; protected `/me` routes.
- `frontend/src/app/landlord/listings/create/` – Multi‑step listing creation UI.

---
*Generated with Claude Code*