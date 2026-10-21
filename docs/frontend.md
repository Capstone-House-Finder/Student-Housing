# Frontend Workflow

This document outlines the development workflow for the **frontend** portion of the Student Housing Platform.

## Prerequisites
- Node.js v20 (or the version specified in `frontend/.nvmrc`).
- npm (bundled with Node).
- A running backend API (see the backend workflow).

## Getting Started
```bash
cd frontend
npm ci            # Install exact dependencies
npm run dev        # Start Next.js dev server (http://localhost:3000)
```

## Project Structure
- `src/` – Main Next.js application files.
- `components/` – Reusable React components.
- `contexts/` – React Context providers (e.g., AuthContext).
- `lib/` – Utility functions and API client (`api.ts`).
- `styles/` – Global CSS and Bootstrap overrides.

## Building for Production
```bash
npm run build
npm start          # Serve the built app
```

## Testing
```bash
npm test           # Run Jest + React Testing Library
```

## Linting & Type‑checking
```bash
npm run lint        # ESLint checks
npm run type-check  # TypeScript compilation check
```

## CI Integration
The frontend CI workflow (`.github/workflows/frontend-ci.yml`) runs lint, type‑check, and tests on each push.

---

*For detailed API usage, see the Backend API Reference.*