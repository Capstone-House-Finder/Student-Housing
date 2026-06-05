Use Plan mode. Do not execute any terminal commands or write any files
until I have reviewed and approved the plan in Step 1 (codebase scan).

# DO-01 – CI/CD Pipeline Setup with GitHub Actions

## Your Role
You are a senior DevOps engineer helping me implement a GitHub Actions CI/CD pipeline
for an existing full-stack project. Before writing or modifying any file, you must
scan the codebase thoroughly and use what you find to inform every decision.

---

## Step 1 — Scan the Codebase First

Before doing anything else, explore the project and answer each of the following:

### Project Structure
- [ ] What is the root directory layout? (monorepo, separate repos, etc.)
- [ ] Where is the frontend located? Where is the backend located?
- [ ] Is there a `mysql/` or `db/` directory with schema or migration files?
- [ ] Is there already a `.github/workflows/` directory? If so, list the existing files.

### Frontend (Next.js)
- [ ] What is the exact `node` version in `.nvmrc`, `package.json engines`, or `Dockerfile`?
- [ ] What scripts exist in `frontend/package.json`? (look for `lint`, `type-check`, `test`, `build`)
- [ ] Is TypeScript used? Check for `tsconfig.json`.
- [ ] What test framework is used? (Jest, Vitest, etc.) Check `package.json devDependencies`.
- [ ] What environment variables does the frontend need? Check `frontend/.env.example` or any `.env*` file.

### Backend (Node.js)
- [ ] What is the entry point? (`index.js`, `server.js`, `app.js`, `api/index.js`, etc.)
- [ ] What scripts exist in `backend/package.json`? (look for `lint`, `type-check`, `test`, `start`)
- [ ] Is TypeScript used? Check for `tsconfig.json`.
- [ ] What test framework is used? Check `package.json devDependencies`.
- [ ] Is it structured as an Express app or as Vercel serverless functions?
- [ ] Is there a `vercel.json` in the backend directory?
- [ ] What migration tool is used? (`knex`, `db-migrate`, `Flyway`, etc.)
- [ ] What environment variables does the backend need? Check `backend/.env.example`.

### Database
- [ ] What is the migration tool and where are migration files located?
- [ ] Is there a `knexfile.js` or equivalent config file?
- [ ] Is there a schema file under `mysql/` or similar?

### Existing CI/CD
- [ ] Are there any existing workflow files under `.github/workflows/`?
- [ ] If yes, read each one and identify what is already working vs. what is broken or missing.

---

## Step 2 — Implement the Workflows

Once you have completed the scan, implement the following four GitHub Actions workflow
files under `.github/workflows/`. Base every decision (node version, script names,
working directories, artifact paths) on what you found in Step 1.

### Workflow 1: `frontend-ci.yml`
Trigger on push and pull_request to: `develop`, `main`, `release/**`, `hotfix/**`,
`feature/**`, `bugfix/**` — scoped to paths under `frontend/**`.

Jobs (in order):
1. **lint** — install deps, run ESLint, run TypeScript type-check (if TS is used)
2. **test** — install deps, run tests with coverage, upload coverage artifact
3. **build** — depends on lint + test, install deps, build Next.js app, upload build artifact

Notes:
- Use `concurrency` to cancel in-progress runs on the same branch.
- Upload artifacts only on `develop`, `main`, `release/**`, `hotfix/**` branches.
- Artifact paths must be prefixed with `frontend/` (working-directory does not affect artifact paths).
- Use `vars.NEXT_PUBLIC_API_URL` for the build env variable with a fallback value.

### Workflow 2: `backend-ci.yml`
Trigger on push and pull_request to: `develop`, `main`, `release/**`, `hotfix/**`,
`feature/**`, `bugfix/**` — scoped to paths under `backend/**` and `mysql/**`.

Jobs (in order):
1. **lint** — install deps, run ESLint, run TypeScript type-check (if TS is used)
2. **test** — spin up a local MySQL 8.0 service container (never use the real Aiven DB
   in CI), configure the test DB user via root, apply the schema file, run tests with
   coverage, upload coverage artifact

Notes:
- Use `concurrency` to cancel in-progress runs on the same branch.
- In the test job, hardcode `DATABASE_URL` to point to the local MySQL service container,
  NOT to `${{ secrets.DATABASE_URL }}` which points to Aiven.
- The user creation step must run as root BEFORE the schema is applied as appuser.
- Artifact paths must be prefixed with `backend/`.

### Workflow 3: `deploy.yml`
Trigger on push to: `develop`, `main`, `release/**`, `hotfix/**`.

Jobs (in order):
1. **resolve-env** — map branch name to environment:
   - `develop` → `staging`
   - `release/**` → `uat`
   - `main` or `hotfix/**` → `production`
   Output both `env_name` and `is_production` (true/false).

2. **deploy-frontend** — deploy the Next.js frontend to Vercel using
   `amondnet/vercel-action@v25`. Pass `--prod` flag only when `is_production == true`.

3. **deploy-backend** — set up Node.js, install deps, run Knex migrations against the
   real Aiven DB for the target environment (each GitHub environment has its own
   `DATABASE_URL` secret), then deploy the Node.js backend to Vercel using
   `amondnet/vercel-action@v25`. Pass `--prod` flag only when `is_production == true`.

Notes:
- Use `concurrency` to cancel in-progress runs on the same branch.
- Use GitHub Environments (`environment: name: ${{ needs.resolve-env.outputs.env_name }}`)
  on deploy jobs so each environment uses its own scoped secrets.
- Frontend and backend use separate Vercel project IDs:
  `VERCEL_FRONTEND_PROJECT_ID` and `VERCEL_BACKEND_PROJECT_ID`.
- Include the Slack notify job as a comment block (already wired up, just commented out).

### Workflow 4: `release-tag.yml`
Trigger on `pull_request` to `main` with type `closed`.

Jobs:
1. **tag-release** — only runs when a `release/**` or `hotfix/**` branch is merged
   (not just closed). Extracts the version from the branch name, creates and pushes an
   annotated git tag (`v{version}`), then creates a GitHub Release with auto-generated
   release notes and a `name` field set to `Release v{version}`.

---

## Step 3 — Verify Against Acceptance Criteria

After writing the files, check each item below and confirm it is satisfied:

- [ ] PRs to `develop` and `main` are blocked if any CI step fails
- [ ] The build and test stage is structured to complete in under 5 minutes
  (caching enabled, jobs parallelised where possible)
- [ ] Pushes to `develop` trigger automatic staging deployment
- [ ] Pushes to `main` trigger automatic production deployment
- [ ] All secrets (DB, JWT, Cloudinary, Vercel) are injected via GitHub Secrets —
  none are hardcoded
- [ ] Frontend and backend are deployed as separate Vercel projects
- [ ] Database migrations run automatically on every deploy before the app is deployed
- [ ] A manual or tag-based production release workflow exists

---

## Step 4 — Output a Secrets Checklist

List every GitHub Secret and Repository Variable that needs to be configured,
grouped by scope (repo-level vs. per-environment), so I can set them up in
GitHub Settings → Secrets and variables → Actions.

Format:
```
### Repo-level Secrets
- VERCEL_TOKEN
- VERCEL_ORG_ID
- ...

### Per-environment Secrets (staging / uat / production)
- DATABASE_URL        ← different value per environment (Aiven instance)
- ...

### Repository Variables (not secrets)
- NEXT_PUBLIC_API_URL ← used in frontend build
```

---

## Context

- **Frontend:** Next.js (TypeScript)
- **Backend:** Node.js / Express (TypeScript), deployed as Vercel serverless functions
- **Database:** MySQL hosted on Aiven (separate instances for staging, UAT, production)
- **Media:** Cloudinary
- **Deployment:** Vercel (frontend and backend as separate projects)
- **Branching strategy:** Gitflow
  (`main`, `develop`, `release/**`, `hotfix/**`, `feature/**`, `bugfix/**`)
- **Migration tool:** Knex
- **Local CI testing:** `act` (GitHub Actions local runner)
