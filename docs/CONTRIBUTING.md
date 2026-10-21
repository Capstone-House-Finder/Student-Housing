# Contribution Guide

Thank you for your interest in contributing to the **Student Housing Platform**! This guide outlines the steps and best practices to help you make valuable contributions efficiently.

---

## 📖 Table of Contents
1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Branching Strategy & Workflow](#branching-strategy--workflow)
4. [Code Style & Formatting](#code-style--formatting)
5. [Testing](#testing)
6. [Documentation](#documentation)
7. [Commit Message Convention](#commit-message-convention)
8. [Pull Request Process](#pull-request-process)
9. [CI / GitHub Actions](#ci--github-actions)
10. [Release Process](#release-process)
11. [License & Code of Conduct](#license--code-of-conduct)
12. [Helpful Resources](#helpful-resources)

---

## Getting Started
1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/Student-Housing.git
   cd Student-Housing
   ```
3. **Create a new branch** following the naming conventions in the *Branching Strategy* section.
4. Follow the steps below to set up the development environment, make changes, test, and submit a PR.

---

## Development Environment
### Prerequisites
- **Node.js** v20 (or the version specified in `.nvmrc`/`package.json`).
- **npm** (comes with Node) – use `npm ci` to install exact versions.
- **MySQL** (Aiven or local) – for backend integration tests.
- **Git** (latest stable).
- **Docker** (optional) – for reproducing the production containers.

### Backend Setup
```bash
cd backend
npm ci            # install exact dependencies
npm run dev        # start development server (http://localhost:5000)
npm test           # run backend test suite
```

### Frontend Setup
```bash
cd frontend
npm ci            # install exact dependencies
npm run dev        # start Next.js dev server (http://localhost:3000)
npm test           # run frontend test suite
```

> **Tip:** The root `package.json` contains a convenience script to run both servers simultaneously:
> ```bash
> npm run dev   # runs backend and frontend dev servers
> ```

---

## Branching Strategy & Workflow
| Type | Prefix | Example |
|------|--------|---------|
| Feature | `feature/` | `feature/12-photo-upload-endpoint` |
| Bugfix | `bugfix/` | `bugfix/fixing-backend-ci` |
| Hotfix | `hotfix/` | `hotfix/75-fixing-redirect` |
| QA / Test Suite | `qa/` | `qa/issue-33-write-and-execute-authentication-test-suite` |
| Documentation | `docs/` | `docs/update-api-docs` |

1. **Create a branch** off `develop` (or the appropriate long‑living branch):
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-short-description
   ```
2. **Commit often** – small, focused commits make code review easier.
3. **Sync regularly** with `develop` to avoid large merge conflicts:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

---

## Code Style & Formatting
- **Backend** – Follow the **StandardJS** style (already enforced by `npm run lint`).
- **Frontend** – Use **ESLint** with the Airbnb configuration (included in `frontend/.eslintrc.js`).
- **TypeScript** – Types must be explicit; enable `noImplicitAny`.
- **Prettier** – Run `npm run format` before committing.
- **Imports** – Keep imports sorted alphabetically and group external vs internal.

---

## Testing
1. **Unit Tests** – Use **Jest** for both backend and frontend.
2. **Integration Tests** – Backend tests live in `backend/tests/` and use `supertest`.
3. **End‑to‑End** – Optional; see the `e2e/` folder for Cypress setup.
4. **Run all tests**:
   ```bash
   npm run test   # runs both backend and frontend suites
   ```
5. **Coverage** – Aim for >80% coverage. CI will fail on lower coverage.

---

## Documentation
- Update **`docs/`** files that are impacted by your change.
- Add JSDoc comments to new functions or classes.
- If you add new API endpoints, update `docs/openapi.json` and `docs/API_DOCUMENTATION.md`.

---

## Commit Message Convention
We follow the **Conventional Commits** specification:
```
<type>(<scope>): <short summary>

<body>

<footer>
```
- **type**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- **scope**: optional, e.g., `auth`, `listing`, `frontend`.
- **footer**: reference issue numbers, e.g., `Closes #33`.

Example:
```
feat(auth): add JWT refresh endpoint

Implemented a refresh token flow to extend session lifespan.
Closes #45
```

---

## Pull Request Process
1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-branch
   ```
2. **Open a PR** targeting `develop` (or the appropriate base).
3. **PR Title** – Use the same format as commit messages.
4. **PR Description** – Include:
   - Brief summary of what the PR does.
   - Related issue(s) (e.g., `Closes #33`).
   - How to test the changes.
   - Any breaking changes.
5. **Assign reviewers** – The repository maintainers will assign automatically, but you may request specific teammates.
6. **CI checks** – Ensure all checks pass (lint, type‑check, tests, coverage).
7. **Address review feedback** – Push additional commits to the same branch; they will automatically update the PR.
8. **Merge** – Once approved and CI passes, click **Merge** (Squash & Merge is preferred).

---

## CI / GitHub Actions
- **backend-ci.yml** – Lints, runs backend tests, and builds Docker image.
- **frontend-ci.yml** – Lints, type‑checks, runs frontend tests.
- **deploy.yml** – Deploys to staging/production on merge to `main`.
- All CI runs on **Node 20**.

> **Note:** PRs that fail any CI job cannot be merged.

---

## Release Process
1. **Create a release branch** from `main` (e.g., `release/v1.2.0`).
2. **Update** `CHANGELOG.md` and bump version in the root `package.json` and relevant sub‑project `package.json` files.
3. **Run** `npm run build` for both backend and frontend to ensure artifacts are production‑ready.
4. **Tag** the commit:
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push origin v1.2.0
   ```
5. **GitHub Actions** will automatically publish Docker images and update documentation.

---

## License & Code of Conduct
- This project is licensed under the **MIT License** – see `LICENSE`.
- Please follow the **Contributor Covenant Code of Conduct** (`CODE_OF_CONDUCT.md`).

---

## Helpful Resources
- **Project Wiki** – https://github.com/Capstone-House-Finder/Student-Housing/wiki
- **API Spec** – `docs/openapi.json`
- **Style Guides** –
  - Backend: https://standardjs.com/
  - Frontend: https://github.com/airbnb/javascript
- **GitHub Flow** – https://guides.github.com/introduction/flow/

---

**Happy coding!** 🎉
