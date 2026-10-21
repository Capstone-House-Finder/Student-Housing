# Testing Guide

This document describes how to run and maintain tests for the **Student Housing Platform**. The project uses **Jest** for both backend and frontend test suites, with additional utilities for integration and end‑to‑end testing.

---

## 📂 Test Structure
- **Backend tests** – located in `backend/tests/`. They use `supertest` to make HTTP requests against the Express server and mock the MySQL pool via `jest.unstable_mockModule('../config/database.js', ...)`.
- **Frontend tests** – located in `frontend/tests/`. They use **Jest** together with **React Testing Library** to render components and simulate user interactions.
- **Shared utilities** – any common mock data or helpers live in `tests/utils/` (if needed).

---

## 🛠️ Prerequisites
1. **Node.js v20** (or the version defined in each sub‑project).
2. **npm** – run `npm ci` in each sub‑project to install exact dependencies.
3. **MySQL** – for integration tests that hit the DB, ensure a test database is available (the CI uses an in‑memory mock; locally you can spin up a Docker MySQL container).

---

## ▶️ Running Tests
### Backend
```bash
cd backend
npm test                # Run the full backend test suite
npm test -- backend/tests/authentication.test.js   # Run a single test file
npm test -- --watch      # Watch mode – re‑run tests on file changes
```
> **Note:** The backend CI job runs `npm run lint && npm test && npm run coverage`.

### Frontend
```bash
cd frontend
npm test                # Run all frontend tests
npm test -- src/components/Button.test.tsx   # Target a specific test
npm test -- --watch      # Watch mode for rapid feedback
```

### Combined (root level)
If a root `package.json` defines a script that runs both suites:
```bash
npm run test   # Executes backend and frontend tests sequentially
```

---

## 📈 Code Coverage
- Coverage is generated with **Jest's built‑in coverage reporter**.
- To view a coverage report locally:
  ```bash
  cd backend   # or frontend
  npm test -- --coverage
  ```
- The CI pipeline fails the build if coverage drops below **80 %**.

---

## 🧪 Test Types
| Type | Description | Location |
|------|-------------|----------|
| Unit | Isolate a single function/module. | `tests/unit/` |
| Integration | Test interaction between modules (e.g., controller + service + DB mock). | `backend/tests/` |
| E2E (optional) | Full stack flow via a headless browser (Cypress). | `e2e/` |

---

## 🔧 Common Helpers
- **Mock DB pool** – see `backend/tests/__mocks__/database.js` for a template.
- **Auth utilities** – `tests/utils/authMock.js` provides functions to generate JWTs for testing protected routes.
- **API client wrapper** – `frontend/tests/__mocks__/api.ts` mocks the `lib/api.ts` client.

---

## 📚 Further Reading
- **Backend testing guidance** – see `docs/TESTING_AUDIT_REPORT.md` for audit‑level details.
- **Frontend testing best practices** – see the `frontend/README.md` or the official React Testing Library docs.

---

## ✅ Checklist for Contributors
- [ ] All new code is covered by **unit or integration tests**.
- [ ] Run `npm test` locally and ensure **no failures**.
- [ ] Verify that the **coverage** threshold is met.
- [ ] Add any required **mock data** to the shared utilities.

---

*Happy testing!*