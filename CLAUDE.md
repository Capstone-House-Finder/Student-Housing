# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository, detailing the project's structure, architecture, and key implementation aspects.

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
- **API Client** – `lib/api.ts` provides a modular fetch wrapper for all endpoints.

## Detailed Project Structure

``` text
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