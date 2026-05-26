# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository, detailing the project's structure, architecture, and key implementation aspects.

## Project Overview

A full-stack Student Housing Platform connecting students with landlords.
- **Frontend**: Next.js 16 (App Router), React 19, Bootstrap 5.
- **Backend**: Express.js REST API.
- **Database**: MySQL (Aiven) with SSL support.
- **Authentication**: JWT-based RBAC (Student, Landlord, Admin) via HTTP-only cookies.

## High‑Level Architecture

### Backend (`backend/`)
- **Entry Point**: `src/app.js` (loads environment variables, creates DB pool, registers routes, starts HTTP server).
- **Database**: `src/config/database.js` uses `mysql2/promise` with SSL for connection pooling.
- **Routes**: `src/Routes/` groups REST endpoints (e.g., `userRoutes.js`, `listingRoutes.js`).
- **Controllers**: `src/controllers/` contain the business logic for each resource (user registration/login, listing CRUD, amenities, photos).
- **Middleware**: `src/middleware/` provides JWT authentication (`auth.js`), error handling, and 404 handling.
- **Tests**: Jest unit tests live beside each controller (`*.test.js`). Tests mock the DB pool and external libs to run offline.

### Frontend (`frontend/`)
- **Framework** – Next.js 16 App Router.
- **Entry Point**: `src/app/page.tsx` (Next.js app root).
- **State & Auth** – `AuthContext.tsx` handles user state; `middleware.ts` enforces RBAC and route protection.
- **Forms & Validation** – `react-hook-form` with `zod` schemas (defined in `lib/validations.ts`).
- **UI Components** – Bootstrap 5 for layout, plus custom components in `components/ui/` (e.g., Sidebar, StarRating).
- **State** – Custom hook `useCreateListing` orchestrates form state and API calls.
- **Styling** – CSS modules + inline styles.
- **Testing** – Jest + React Testing Library (`npm test`).
- **API Client** – `lib/api.ts` provides a modular fetch wrapper for all endpoints.

## Detailed Project Structure

```
project-root/
├── .github/                      # GitHub Actions workflows and validation scripts
│   ├── workflows/                # CI/CD workflow definitions
│   │   ├── backend-ci.yml        # Backend Continuous Integration
│   │   ├── deploy.yml            # Deployment workflow
│   │   ├── frontend-ci.yml       # Frontend Continuous Integration
│   │   └── release-tag.yml       # Release tagging workflow
│   └── validate_workflows.py     # Python script to validate CI/CD workflows
├── backend/                      # Express.js REST API
│   ├── src/
│   │   ├── app.js                # Main Express application entry point, server setup
│   │   ├── config/               # Configuration files
│   │   │   └── database.js       # MySQL connection pool setup (Aiven with SSL)
│   │   ├── controllers/          # Business logic for API endpoints
│   │   │   ├── userController.js # User registration, login, profile management, admin user actions
│   │   │   ├── listingController.js # Listing CRUD operations
│   │   │   ├── reviewController.js # Review submission and landlord replies
│   │   │   ├── passwordResetController.js # Password reset flow
│   │   │   └── ...               # Other resource controllers (e.g., amenities, reports)
│   │   ├── middleware/           # Express middleware functions
│   │   │   ├── auth.js           # JWT authentication and role-based authorization
│   │   │   └── errorHandler.js   # Centralized error handling middleware
│   │   ├── Routes/               # API route definitions
│   │   │   ├── userRoutes.js     # User-related routes (auth, profile)
│   │   │   ├── listingRoutes.js  # Listing-related routes
│   │   │   ├── reviewRoutes.js   # Review-related routes
│   │   │   └── ...               # Other resource routes
│   │   └── utils/                # General utility functions (e.g., email, file upload helpers)
│   ├── tests/                    # Unit and integration tests (some live beside controllers)
│   ├── Dockerfile                # Docker build instructions for the backend service
│   ├── package.json              # Backend dependencies and scripts
│   └── .env.example              # Environment variables template for backend
├── frontend/                     # Next.js 16 (App Router) application
│   ├── app/                      # Next.js App Router pages and layouts
│   │   ├── (public)/             # Publicly accessible routes (no authentication required)
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── login/            # Login page
│   │   │   ├── register/         # Registration page
│   │   │   ├── forgot-password/  # Password recovery initiation
│   │   │   ├── reset-password/   # Password reset completion
│   │   │   ├── search/           # Property search and filtering page
│   │   │   └── listings/[id]/    # Dynamic route for individual property details
│   │   ├── student/              # Student-specific routes (requires student role)
│   │   │   ├── dashboard/        # Student dashboard
│   │   │   └── profile/          # Student profile management
│   │   ├── landlord/             # Landlord-specific routes (requires landlord role)
│   │   │   ├── dashboard/        # Landlord dashboard
│   │   │   └── listings/         # Listing management for landlords
│   │   │       ├── create/       # Multi-step listing creation wizard
│   │   │       └── [id]/edit/    # Dynamic route for editing existing listings
│   │   ├── admin/                # Admin-specific routes (requires admin role)
│   │   │   └── dashboard/        # Admin dashboard for moderation and management
│   │   ├── layout.tsx            # Root layout for the entire application
│   │   ├── globals.css           # Global CSS styles (includes Bootstrap imports)
│   │   └── not-found.tsx         # Custom 404 error page
│   ├── components/               # Reusable UI components
│   │   ├── Navbar.tsx            # Application navigation bar
│   │   ├── Footer.tsx            # Application footer
│   │   ├── PropertyCard.tsx      # Component for displaying a single property listing summary
│   │   ├── StarRating.tsx        # Star rating display/input component
│   │   ├── ReportModal.tsx       # Modal for reporting listings/users
│   │   ├── ContactLandlordModal.tsx # Modal for students to contact landlords
│   │   ├── Reviews.tsx           # Section for displaying and submitting reviews
│   │   ├── Pagination.tsx        # Pagination controls
│   │   ├── FiltersSidebar.tsx    # Sidebar for search filters
│   │   ├── ImageUpload.tsx       # Component for image uploading
│   │   ├── ProtectedRoute.tsx    # HOC/Wrapper for protecting client-side routes
│   │   ├── LoadingSpinner.tsx    # Loading indicator component
│   │   ├── ErrorAlert.tsx        # Component for displaying error messages
│   │   └── ...                   # Other specific UI components
│   ├── contexts/                 # React Context API providers for global state
│   │   └── AuthContext.tsx       # Manages user authentication state and provides user info
│   ├── lib/                      # Utility functions, helpers, and configurations
│   │   ├── api.ts                # Centralized API client for interacting with the backend
│   │   ├── validations.ts        # Zod schemas for robust form validation
│   │   └── utils.ts              # General purpose utility functions
│   ├── public/                   # Static assets served directly by Next.js
│   ├── middleware.ts             # Next.js middleware for server-side route protection and RBAC
│   ├── Dockerfile                # Docker build instructions for the frontend service
│   ├── package.json              # Frontend dependencies and scripts
│   ├── .env.example              # Environment variables template for frontend
│   ├── README.md                 # Frontend-specific README
│   └── ...                       # Other frontend configuration files (tsconfig.json, next.config.mjs, etc.)
├── mysql/                        # MySQL database related files
│   └── init/                     # Initialization scripts for Dockerized MySQL
│       └── 01_schema.sql         # Initial database schema definition
├── .env.example                  # Root-level environment variables template for Docker Compose
├── docker-compose.yml            # Docker Compose configuration for local development environment
├── README.md                     # Main project README file
├── CLAUDE.md                     # This file, providing context for AI assistants
├── PROJECT_SUMMARY.md            # Comprehensive project overview and feature list
├── QUICK_START.md                # Quick start guide for developers
└── ...                           # Other root-level configuration files (.gitignore, etc.)
```

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
- `frontend/middleware.ts` – Server-side auth and role-based redirection logic.
- `frontend/lib/validations.ts` – Centralized Zod schemas for all forms.

## Technical Standards
- **Code Quality**: Ensure all frontend forms use Zod validation.
- **Security**: All sensitive backend routes must use the `auth.js` middleware. Use HTTP-only cookies for tokens.
- **CI/CD**: Workflows are validated by `.github/validate_workflows.py`. Node version 20 is required for all CI jobs.
- **Styling**: Prefer Bootstrap 5 utility classes for layout and responsiveness.

---
*Generated with Claude Code*