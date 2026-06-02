# Agent Execution Prompt
## Student Housing Platform — Mobile Multi-Repo Implementation

---

## Your Role

You are a senior full-stack and DevOps engineer executing a structured implementation plan. You are working across two GitHub repositories and a shared private npm package. You have full access to the file system, can run bash commands, read and write all project files, and interact with git. You must follow the plan precisely and in order. Do not skip phases. Do not proceed to the next task until the current one is complete and verified.

---

## Project Context

Read these two files completely before writing a single line of code:

1. `CLAUDE.md` — architecture, structure, conventions, and testing guidance for the existing web platform
2. `implementation_plan_multirepo.md` — the full phased implementation plan you will execute

The existing project is a Student Housing Platform:
- **Web repo** (`web-platform/`): Next.js 16 frontend + Express.js backend + MySQL
- **Mobile repo** (`mobile-app/`): to be created — React Native + Expo SDK 53
- **Shared package** (`packages/shared/`): to be created inside the web repo, then published to GitHub Packages

Your job is to implement all phases in sequence. Each phase below tells you exactly what to do and what done looks like.

---

## Critical Rules

1. **Read before writing.** Before touching any existing file, read it in full. Never overwrite logic you haven't understood.
2. **Never break the web platform.** The existing `frontend/` and `backend/` must remain fully functional after every step. Run `npm test` in `backend/` after any backend change.
3. **Shared package is the single source of truth.** `api.ts`, `validations.ts`, `utils.ts`, and all TypeScript interfaces live in `packages/shared/src/` only. The `frontend/lib/` versions become thin re-exports. The mobile app never has its own copies.
4. **No placeholder code.** Every file you create must be production-ready and complete. No `// TODO`, no stub functions, no empty implementations.
5. **Verify each phase before moving on.** The verification step at the end of each phase is not optional.
6. **Ask before deviating.** If you discover a conflict, ambiguity, or missing information that would require you to deviate from the plan, stop and ask. Do not make assumptions that affect architecture.
7. **Use Gitflow.** For every feature create a branch according to the gitflow branching strategy

---

## Phase 0 — Web Repo Refactoring
**Goal**: Extract shared code from the web repo into `packages/shared/` without breaking the frontend.

### Tasks

**0.1 — Read existing shared files**
Read the complete contents of:
- `frontend/lib/api.ts`
- `frontend/lib/validations.ts`
- `frontend/lib/utils.ts`
- All TypeScript interfaces/types used across the frontend (search `types/` and inline type definitions)

**0.2 — Create `packages/shared/`**

Create the following file tree exactly as specified in `implementation_plan_multirepo.md` Phase 0:
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/api.ts` — full content migrated from `frontend/lib/api.ts`, with the base URL made injectable via `configureApi(baseUrl: string)` (see plan for exact diff)
- `packages/shared/src/validations.ts` — full content from `frontend/lib/validations.ts` (no changes needed)
- `packages/shared/src/utils.ts` — full content from `frontend/lib/utils.ts` (no changes needed)
- `packages/shared/src/types/user.ts` — all user-related interfaces extracted from the frontend
- `packages/shared/src/types/listing.ts` — all listing-related interfaces
- `packages/shared/src/types/review.ts` — all review-related interfaces
- `packages/shared/src/types/rental.ts` — all rental-related interfaces
- `packages/shared/src/types/index.ts` — barrel export of all types
- `packages/shared/src/index.ts` — barrel export of everything

**0.3 — Update `frontend/` to consume the local shared package**

- Update `frontend/package.json` to add `"@your-org/housing-shared": "file:../packages/shared"`
- Rewrite `frontend/lib/api.ts` as a thin re-export that calls `configureApi` with `process.env.NEXT_PUBLIC_API_URL`
- Rewrite `frontend/lib/validations.ts` as a re-export from the shared package
- Rewrite `frontend/lib/utils.ts` as a re-export from the shared package
- Update all frontend import paths that referenced these files directly — they should continue to work unchanged

**0.4 — Apply CI/CD fixes**

Apply all three workflow fixes from the plan to:
- `.github/workflows/frontend-ci.yml` (artifact path fix)
- `.github/workflows/backend-ci.yml` (DATABASE_URL + artifact path fix)
- `.github/workflows/deploy.yml` (add `is_production` output)

**0.5 — Add `publish-shared.yml` workflow**

Create `.github/workflows/publish-shared.yml` exactly as specified in the plan.

### Verification — Phase 0
```bash
# 1. Build the shared package
cd packages/shared && npm install && npm run build
# Expected: dist/ directory created, no TypeScript errors

# 2. Install frontend dependencies with local shared package
cd frontend && npm install
# Expected: no errors, node_modules/@your-org/housing-shared symlinked

# 3. Type-check the frontend
cd frontend && npx tsc --noEmit
# Expected: zero errors

# 4. Run frontend tests
cd frontend && npm test
# Expected: all existing tests pass

# 5. Run backend tests (must be unaffected)
cd backend && npm test
# Expected: all existing tests pass
```

Do not proceed to Phase 1 until all five checks pass.

---

## Phase 1 — Mobile Repo Scaffolding
**Goal**: Create the `mobile-app` repository with the complete directory structure and all configuration files.

> If you are executing this inside an existing repo, create a `mobile-app/` directory at the same level as `web-platform/`. If you are executing inside the new `housing-mobile` repo directly, treat the repo root as the mobile project root.

### Tasks

**1.1 — Initialize Expo project**
```bash
npx create-expo-app@latest . --template tabs
# Then remove the example template files — keep only the scaffolding
```

**1.2 — Create complete directory structure**

Create every directory and file listed in `implementation_plan_multirepo.md` Phase 1.2. For configuration files, use the exact content specified in the plan. For source files that are not yet fully specified (screens, components), create them with complete, production-ready implementations — not stubs.

**1.3 — Install all dependencies**

Install the exact dependency list from Phase 1.3 of the plan. After install:
- Configure NativeWind v4: update `babel.config.js` and create `metro.config.js` with `withNativeWind`
- Configure `react-native-reanimated` in `babel.config.js`
- Configure `@gorhom/bottom-sheet` (requires `react-native-gesture-handler` and `react-native-reanimated`)

**1.4 — Add `.npmrc` for GitHub Packages**

Create `.npmrc` as specified in Phase 1.4 of the plan.

**1.5 — Replace `app.json` with `app.config.ts`**

Use the exact content from Phase 2 of the plan.

**1.6 — Create `eas.json`**

Use the exact content from Phase 2 of the plan.

### Verification — Phase 1
```bash
# 1. Install dependencies (authenticates GitHub Packages)
NODE_AUTH_TOKEN=<your-pat> npm install
# Expected: all packages installed, including @your-org/housing-shared

# 2. Type check
npx tsc --noEmit
# Expected: zero errors

# 3. Lint
npm run lint
# Expected: zero errors

# 4. Expo prebuild (validates all native config without a full build)
npx expo prebuild --no-install --platform all
# Expected: android/ and ios/ directories generated, no config errors

# 5. Verify shared package is accessible
node -e "const s = require('@your-org/housing-shared'); console.log(Object.keys(s))"
# Expected: prints exported API functions and types
```

---

## Phase 2 — Shared Code Integration (Mobile Side)
**Goal**: Wire the shared package into the mobile app's API layer and auth context.

### Tasks

**2.1 — Create `lib/api-config.ts`**

Full content as specified in Phase 2 of the plan. This file imports `configureApi` from the shared package and passes it the URL from `expo-constants`.

**2.2 — Create `contexts/AuthContext.tsx`**

Implement the full auth context:
- Token storage: `expo-secure-store` (access token + refresh token)
- Login: POST to `/api/auth/login`, store both tokens
- Logout: clear SecureStore, call `POST /api/push/unregister`
- Auto-login on app start: read token from SecureStore, validate with `/api/users/me`
- Silent token refresh: intercept 401s, call `POST /api/auth/refresh`, retry original request, logout on refresh failure
- Expose: `user`, `isLoading`, `login()`, `logout()`, `register()`

**2.3 — Create `services/notifications.ts`**

Full implementation as specified in Phase 7 of the plan:
- Request permission
- Get Expo push token
- POST to `/api/push/register` with token + platform
- Export `registerForPushNotifications(userId)` and `unregisterPushNotifications()`

### Verification — Phase 2
```bash
npx tsc --noEmit
# Expected: zero errors across all new files
```

---

## Phase 3 — Design System
**Goal**: Build all `constants/` and `components/ui/` files.

### Tasks

**3.1 — Create `constants/colors.ts`, `constants/typography.ts`, `constants/layout.ts`**

Use the exact color values from Phase 3 of the plan. Typography should define font sizes, weights, and line heights as a design token object. Layout should define spacing scale, border radius, and shadow presets.

**3.2 — Create all `components/ui/` files**

Implement every component listed in the plan's Phase 3 table:
- `Button.tsx` — gradient (LinearGradient), haptic feedback (expo-haptics), loading state
- `Input.tsx` — floating label animation (reanimated), validation error state
- `Card.tsx` — BlurView glassmorphism with solid fallback
- `BottomSheet.tsx` — @gorhom/bottom-sheet wrapper with snap points and backdrop
- `Toast.tsx` — react-native-toast-message with branded styles
- `Badge.tsx` — status variants: available, rented, under_negotiation
- `Avatar.tsx` — image with initials fallback

All components must support both light and dark themes using the `useTheme` hook.

### Verification — Phase 3
```bash
npx tsc --noEmit
# Expected: zero errors
```

---

## Phase 4 — Navigation & Authentication Screens
**Goal**: Implement the full navigation structure and all auth screens.

### Tasks

**4.1 — Create `app/_layout.tsx`**

Root layout wrapping the app in: `AuthProvider → ThemeProvider → QueryClientProvider (with AsyncStorage persister) → GestureHandlerRootView → Stack`.

**4.2 — Create `app/(auth)/_layout.tsx` and all auth screens**

- `login.tsx` — email/password form, react-hook-form + zod (from shared package), biometric option
- `register.tsx` — role picker (Student/Landlord), multi-step form, react-hook-form + zod
- `forgot-password.tsx` — email input, calls `/api/auth/forgot-password`
- `reset-password.tsx` — token + new password form

**4.3 — Create `app/(tabs)/_layout.tsx`**

Bottom tab navigator. Tabs rendered based on user role from `AuthContext`. Admin users get a different tab set. Include the landlord FAB for create listing.

**4.4 — Create `hooks/useTheme.ts`**

Returns current color scheme (light/dark) and the appropriate `Colors.*` palette. Persists user preference to AsyncStorage.

### Verification — Phase 4
```bash
npx tsc --noEmit && npm run lint
# Start the app in Expo Go / dev client and verify:
# - Unauthenticated users land on login screen
# - Successful login redirects to correct role-based tabs
# - Logout returns to login screen
```

---

## Phase 5 — All Screens
**Goal**: Implement every screen listed in Phase 5 of the plan.

Implement in this order:
1. `app/(tabs)/home.tsx`
2. `app/(tabs)/search.tsx` + `components/FilterSheet.tsx`
3. `app/listing/[id].tsx` + `components/ImageCarousel.tsx` + `components/ReviewItem.tsx`
4. `app/(tabs)/dashboard.tsx` (renders StudentDashboard, LandlordDashboard, or AdminDashboard based on role)
5. `app/(tabs)/profile.tsx`
6. `app/landlord/create-listing.tsx` (4-step PagerView wizard with Cloudinary upload)
7. `app/landlord/edit-listing/[id].tsx`
8. `app/admin/dashboard.tsx`, `app/admin/users.tsx`, `app/admin/reports.tsx`

For each screen:
- Use `@tanstack/react-query` for all data fetching (enables offline caching automatically via the persister set up in Phase 4)
- Use `react-hook-form` with zod schemas from the shared package for all forms
- Import API functions exclusively from `lib/api-config.ts` (never import directly from the shared package)
- Implement full loading states, empty states (using `components/EmptyState.tsx`), and error states (using `components/ErrorAlert.tsx`)

### Verification — Phase 5
```bash
npx tsc --noEmit && npm run lint
# Manually test each screen in the Expo dev client
```

---

## Phase 6 — Backend Updates
**Goal**: Add the required backend endpoints to the web repo's Express.js backend.

### Tasks

**6.1 — Add `push_tokens` table**

Add the SQL from Phase 7 of the plan to `mysql/init/01_schema.sql`. Also write a migration script at `backend/src/migrations/add_push_tokens.sql`.

**6.2 — Create `backend/src/controllers/pushController.js`**

Implement:
- `registerToken(req, res)` — upsert token in `push_tokens` for authenticated user
- `unregisterToken(req, res)` — delete token on logout
- `sendNotification(userId, title, body, data)` — internal function used by other controllers; calls Expo Push API at `https://exp.host/--/api/v2/push/send`

**6.3 — Create `backend/src/Routes/pushRoutes.js`**

```
POST /api/push/register    → auth middleware → pushController.registerToken
POST /api/push/unregister  → auth middleware → pushController.unregisterToken
```
Register in `app.js`.

**6.4 — Add `POST /api/auth/refresh` endpoint**

Add to `userRoutes.js` and implement in `userController.js`:
- Accepts `{ refreshToken }` in request body
- Validates the refresh token (signed with `JWT_REFRESH_SECRET` — add this env var)
- Returns new `{ accessToken, refreshToken }`

**6.5 — Add notification triggers to existing controllers**

Add `pushController.sendNotification()` calls to the five events listed in Phase 7 of the plan. Use try/catch — a failed push notification must never cause the primary API response to fail.

**6.6 — Serve `/.well-known/` static files**

Create `backend/.well-known/apple-app-site-association` and `backend/.well-known/assetlinks.json` with the correct structure (see Phase 8 of the plan — fill in `TEAM_ID` and `SHA256_FINGERPRINT` as placeholders clearly marked with `# REPLACE_ME`).

Add static file serving to `backend/src/app.js`.

### Verification — Phase 6
```bash
cd backend && npm test
# Expected: all existing tests pass, no regressions
# New controllers should have unit test files created alongside them (pushController.test.js, etc.)
# Run: npm test -- src/controllers/pushController.test.js
```

---

## Phase 7 — Mobile CI/CD Workflows
**Goal**: Create the three GitHub Actions workflow files for the mobile repo.

### Tasks

Create these files exactly as specified in Phase 9 of the plan:
- `.github/workflows/mobile-ci.yml`
- `.github/workflows/mobile-deploy.yml`
- `.github/workflows/update-shared.yml`

### Verification — Phase 7
```bash
# Validate YAML syntax
npx js-yaml .github/workflows/mobile-ci.yml
npx js-yaml .github/workflows/mobile-deploy.yml
npx js-yaml .github/workflows/update-shared.yml
# Expected: all parse without errors
```

---

## Final Verification

Run this complete checklist before declaring the implementation done:

```bash
# ── Web repo ──────────────────────────────────────────────
cd packages/shared && npm run build          # shared package builds
cd frontend && npx tsc --noEmit              # frontend type-checks clean
cd frontend && npm test                      # all frontend tests pass
cd backend && npm test                       # all backend tests pass

# ── Mobile repo ───────────────────────────────────────────
npx tsc --noEmit                             # mobile type-checks clean
npm run lint                                 # mobile lints clean
npx expo prebuild --no-install --platform all # native config valid
```

Then confirm manually:

| Check | Expected |
|-------|----------|
| Login as Student | Redirects to Student tabs |
| Login as Landlord | Redirects to Landlord tabs with FAB |
| Login as Admin | Redirects to Admin dashboard |
| Browse listings offline | Cached listings shown, offline banner visible |
| Create listing (Landlord) | All 4 steps work, photo uploads to Cloudinary |
| Contact landlord (Student) | Landlord receives push notification |
| Token expiry | Silent refresh occurs, user stays logged in |
| Deep link | `studenthousing://listing/1` opens correct screen |

---

## Secrets Required

Before running CI in either repo, the following GitHub repository secrets must be set:

**Web repo secrets:**
| Secret | Description |
|--------|-------------|
| `JWT_SECRET` | Existing JWT signing secret |
| `JWT_REFRESH_SECRET` | New secret for refresh tokens — generate with `openssl rand -base64 32` |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions |

**Mobile repo secrets:**
| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | From expo.dev account settings |
| `EAS_PROJECT_ID` | From `eas.json` after `eas init` |
| `GITHUB_TOKEN` | Auto-provided (used to read GitHub Packages) |

---

## Out of Scope for This Execution

The following are confirmed features but require separate tasks after this one completes:
- App Store Connect and Google Play Console account setup
- Apple Developer team ID and iOS distribution certificates
- Google Play signing keystore generation
- TestFlight external tester group setup
- Production domain `apple-app-site-association` deployment
