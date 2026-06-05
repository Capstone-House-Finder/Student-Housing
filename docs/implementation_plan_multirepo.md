# Student Housing Platform — Mobile Implementation Plan (Multi-Repo Strategy)

## Background

The Student Housing Platform is currently a full-stack web application:
- **Frontend**: Next.js 16 + React 19 + Bootstrap 5 + Radix UI/shadcn components
- **Backend**: Express.js REST API with JWT auth, MySQL (Aiven), Cloudinary uploads
- **Features**: Role-based auth (student/landlord/admin), property listings CRUD, search & filter, reviews/ratings, reports, rental management, admin dashboard, WhatsApp contact integration

The goal is to create a native mobile application that provides all current features with a premium, mobile-native experience on both **iOS and Android**, using a **two-repository architecture** to maintain clean separation of concerns.

---

## Architecture Decision: Two Repositories + Shared Private Package

The mobile app will live in a **separate repository** (`housing-mobile`). Shared business logic will be extracted from the web repo into a **private npm package** (`@housing/shared`) published via GitHub Packages, consumed by both repos. This eliminates copy-paste drift while keeping deployments fully independent.

```
┌─────────────────────────────────────────────────────────────────────┐
│  REPO 1: housing-platform (existing web repo, refactored)           │
│  ├── backend/         Express.js REST API                           │
│  ├── frontend/        Next.js 16 web app                            │
│  └── packages/shared/ @housing/shared — published to GitHub Pkgs   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ npm install @housing/shared
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  REPO 2: housing-mobile (new repo)                                  │
│  └── Expo React Native app (iOS + Android)                          │
│      consumes @housing/shared for API client, validations, types    │
└─────────────────────────────────────────────────────────────────────┘
```

### Framework Choice: React Native + Expo SDK 53

- Team already knows React/TypeScript — minimal learning curve
- The shared package carries `api.ts`, `validations.ts`, `utils.ts`, and all TypeScript types — no logic is rewritten
- Express.js backend requires only targeted additions (push tokens, token refresh endpoint, admin mobile routes)
- Expo EAS handles iOS + Android builds simultaneously
- Single codebase → both platforms

> **Admin Panel**: The admin dashboard **is included** in the mobile app per requirements, in a dedicated `(admin)/` route group.

---

## Phase 0: Refactor Existing Web Repo (Pre-Mobile Work)

> **This phase must be completed before the mobile repo is created.** It extracts shared code without breaking the existing web app.

### 0.1 — Extract Shared Package

Create `packages/shared/` inside the existing web repo:

```
housing-platform/
├── backend/
├── frontend/
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── api.ts            ← moved from frontend/lib/api.ts
│       │   ├── validations.ts    ← moved from frontend/lib/validations.ts
│       │   ├── utils.ts          ← moved from frontend/lib/utils.ts
│       │   └── types/
│       │       ├── user.ts       ← User, AuthResponse, Role interfaces
│       │       ├── listing.ts    ← Listing, Photo, Amenity interfaces
│       │       ├── review.ts     ← Review, Rating interfaces
│       │       └── index.ts      ← barrel export
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── mysql/
├── docker-compose.yml
└── README.md
```

**`packages/shared/package.json`**:
```json
{
  "name": "@housing/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "restricted"
  },
  "peerDependencies": {
    "zod": "^3.0.0"
  }
}
```

**`packages/shared/tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "./dist",
    "strict": true
  },
  "include": ["src"]
}
```

### 0.2 — Update Frontend to Consume Local Package

Update `frontend/package.json`:
```json
{
  "dependencies": {
    "@housing/shared": "file:../packages/shared"
  }
}
```

Update `frontend/lib/` to re-export from shared:
```typescript
// frontend/lib/api.ts — becomes a thin re-export
export * from '@housing/shared';
```

### 0.3 — Backend Additions Required for Mobile

These are **not optional** — they are required by the confirmed mobile feature set.

#### `backend/src/Routes/pushRoutes.js`
```javascript
router.post('/api/push/register',   authenticate, pushController.register);
router.post('/api/push/unregister', authenticate, pushController.unregister);
router.post('/api/push/send',       authenticate, authorize('admin'), pushController.send);
```

#### `backend/src/Routes/authRoutes.js` — Add Token Refresh
```javascript
router.post('/api/auth/refresh', authController.refresh);
```
Mobile apps cannot rely on HTTP-only cookies. A `/refresh` endpoint is required to silently renew JWTs without forcing re-login mid-session.

#### Database Schema Additions (`mysql/init/02_mobile_schema.sql`)
```sql
CREATE TABLE push_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  platform    ENUM('ios', 'android') NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sync_metadata (
  user_id               INT PRIMARY KEY,
  listings_synced_at    TIMESTAMP,
  profile_synced_at     TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users ADD COLUMN refresh_token VARCHAR(512) NULL;
ALTER TABLE users ADD COLUMN refresh_token_expires_at TIMESTAMP NULL;
```

### 0.4 — Publish Shared Package via GitHub Actions

**`.github/workflows/publish-shared.yml`**:
```yaml
name: Publish Shared Package
on:
  push:
    branches: [main]
    paths: ['packages/shared/**']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'
      - run: cd packages/shared && npm ci && npm run build
      - run: cd packages/shared && npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 0.5 — Fix Existing CI/CD Workflow Failures

#### [MODIFY] `.github/workflows/frontend-ci.yml`
```diff
-            .next/
-            public/
+            frontend/.next/
+            frontend/public/
```

#### [MODIFY] `.github/workflows/backend-ci.yml`
```diff
-      DATABASE_URL: ${{ secrets.DATABASE_URL }}
+      DATABASE_URL: mysql://appuser:apppassword@127.0.0.1:3306/student_housing_test
```
```diff
-          path: coverage/
+          path: backend/coverage/
```

#### [MODIFY] `.github/workflows/deploy.yml`
```diff
   resolve-env:
     outputs:
       env_name: ${{ steps.env-map.outputs.env_name }}
+      is_production: ${{ steps.env-map.outputs.is_production }}
     steps:
       - id: env-map
         run: |
           case "${GITHUB_REF_NAME}" in
-            develop)       echo "env_name=staging" >> $GITHUB_OUTPUT ;;
-            release/*)     echo "env_name=uat" >> $GITHUB_OUTPUT ;;
-            main|hotfix/*) echo "env_name=production" >> $GITHUB_OUTPUT ;;
-            *)             echo "env_name=none" >> $GITHUB_OUTPUT ;;
+            develop)
+              echo "env_name=staging" >> $GITHUB_OUTPUT
+              echo "is_production=false" >> $GITHUB_OUTPUT ;;
+            release/*)
+              echo "env_name=uat" >> $GITHUB_OUTPUT
+              echo "is_production=false" >> $GITHUB_OUTPUT ;;
+            main|hotfix/*)
+              echo "env_name=production" >> $GITHUB_OUTPUT
+              echo "is_production=true" >> $GITHUB_OUTPUT ;;
+            *)
+              echo "env_name=none" >> $GITHUB_OUTPUT
+              echo "is_production=false" >> $GITHUB_OUTPUT ;;
           esac
```

---

## Phase 1: Create the Mobile Repository

### Repository Structure

Create a new GitHub repository named **`housing-mobile`**:

```
housing-mobile/
├── .github/
│   └── workflows/
│       ├── mobile-ci.yml
│       ├── mobile-deploy.yml
│       └── update-shared.yml
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── search.tsx
│   │   ├── dashboard.tsx
│   │   └── profile.tsx
│   ├── (admin)/
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── reports.tsx
│   │   └── users.tsx
│   ├── listing/
│   │   └── [id].tsx
│   └── landlord/
│       ├── create-listing.tsx
│       └── edit-listing/
│           └── [id].tsx
├── components/
│   ├── PropertyCard.tsx
│   ├── StarRating.tsx
│   ├── FilterSheet.tsx
│   ├── ImageCarousel.tsx
│   ├── ReviewItem.tsx
│   ├── ContactModal.tsx
│   ├── ReportModal.tsx
│   ├── LoadingOverlay.tsx
│   ├── EmptyState.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       ├── BottomSheet.tsx
│       └── Toast.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useListings.ts
│   ├── useOfflineSync.ts
│   ├── usePushNotifications.ts
│   └── useTheme.ts
├── lib/
│   └── storage.ts
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   └── layout.ts
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
├── app.config.ts
├── eas.json
├── package.json
├── tsconfig.json
├── babel.config.js
└── .npmrc
```

### Key Configuration Files

#### `package.json`
```json
{
  "name": "housing-mobile",
  "version": "1.0.0",
  "dependencies": {
    "@housing/shared": "^1.0.0",
    "expo": "~53.0.0",
    "expo-router": "~4.0.0",
    "react-native": "0.76.x",
    "expo-secure-store": "~14.0.0",
    "expo-notifications": "~0.29.0",
    "expo-image-picker": "~16.0.0",
    "expo-local-authentication": "~14.0.0",
    "expo-constants": "~17.0.0",
    "expo-updates": "~0.26.0",
    "expo-haptics": "~14.0.0",
    "expo-sharing": "~12.0.0",
    "expo-splash-screen": "~0.29.0",
    "@gorhom/bottom-sheet": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/query-async-storage-persister": "^5.0.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-toast-message": "^2.2.0",
    "nativewind": "^4.0.0",
    "zod": "^3.23.0"
  }
}
```

#### `app.config.ts`
```typescript
import 'dotenv/config';

export default {
  expo: {
    name: "Student Housing",
    slug: "student-housing",
    version: "1.0.0",
    scheme: "studenthousing",
    extra: {
      apiUrl: process.env.API_URL ?? 'http://localhost:5000',
      easProjectId: process.env.EAS_PROJECT_ID,
    },
    ios: {
      bundleIdentifier: "com.studenthousing.app",
      associatedDomains: ["applinks:housefinder.com"],
    },
    android: {
      package: "com.studenthousing.app",
      intentFilters: [{ action: "VIEW", data: [{ scheme: "https", host: "housefinder.com" }] }],
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      ["expo-notifications", { "sounds": ["notification.wav"] }],
      ["expo-image-picker", { "photosPermission": "Allow Student Housing to access your photos." }],
      ["expo-local-authentication", { "faceIDPermission": "Use Face ID to sign in." }]
    ]
  }
};
```

#### `eas.json`
```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "API_URL": "https://staging.housefinder.com/api" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "API_URL": "https://uat.housefinder.com/api" }
    },
    "production": {
      "env": { "API_URL": "https://housefinder.com/api" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@email.com", "ascAppId": "YOUR_APP_ID" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json" }
    }
  }
}
```

#### `.npmrc`
```
@housing:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

---

## Phase 2: Design System & Theming

### `constants/colors.ts`
```typescript
export const Colors = {
  brand: {
    magenta: '#ef3d83',
    coral:   '#ff7a59',
    gold:    '#ffd166',
    teal:    '#00b894',
    ink:     '#251b3d',
    violet:  '#6c4df6',
  },
  light: {
    background: '#fff7fb',
    card:        'rgba(255,255,255,0.82)',
    text:        '#251b3d',
    subtext:     '#6b7280',
    border:      'rgba(239,61,131,0.15)',
  },
  dark: {
    background: '#1a1225',
    card:        'rgba(40,30,60,0.82)',
    text:        '#f9fafb',
    subtext:     '#9ca3af',
    border:      'rgba(108,77,246,0.25)',
  },
};
```

### `components/ui/` Design System
- **`Button`** — `LinearGradient` backgrounds, `expo-haptics` on press, loading state
- **`Input`** — styled `TextInput` with Zod validation error display
- **`Card`** — `BlurView` glassmorphism effect
- **`BottomSheet`** — wraps `@gorhom/bottom-sheet`, replaces all web modals/dialogs
- **`Toast`** — wraps `react-native-toast-message`

---

## Phase 3: Authentication & Navigation

### `contexts/AuthContext.tsx`

| Web | Mobile |
|-----|--------|
| `js-cookie` / HTTP-only cookies | `expo-secure-store` encrypted token storage |
| `sessionStorage` | `SecureStore` (persists across restarts) |
| Next.js `middleware.ts` | Expo Router `redirect` in `_layout.tsx` |
| Browser auto-sends cookie | `Authorization: Bearer` header injected manually |
| No refresh needed | Silent refresh via `/api/auth/refresh` before expiry |

Token refresh intercept pattern:
```typescript
async function apiRequest(endpoint, options) {
  let response = await fetch(endpoint, withAuth(options));
  if (response.status === 401) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) response = await fetch(endpoint, withAuth(options));
    else signOut();
  }
  return response;
}
```

### Navigation Structure

```
app/
  _layout.tsx    → AuthProvider, QueryClientProvider, GestureHandlerRootView
  index.tsx      → redirect based on auth state
  (auth)/        → Stack navigator, no tab bar
  (tabs)/        → Bottom tab navigator (authenticated)
  (admin)/       → Stack navigator, admin-only guard
```

**Role-based tabs:**

| Tab | Student | Landlord | Admin |
|-----|---------|----------|-------|
| 🏠 Home | ✅ | ✅ | ✅ |
| 🔍 Search | ✅ | ✅ | ✅ |
| 📊 Dashboard | Student view | Landlord view | Redirects to admin stack |
| 👤 Profile | ✅ | ✅ | ✅ |
| 🛡️ Admin | ❌ | ❌ | ✅ separate stack |

---

## Phase 4: Screen-by-Screen Implementation

### Auth Screens

| Screen | Web Source | Mobile Adaptation |
|--------|-----------|-------------------|
| Login | `AuthSlidingPanel.tsx` | Gradient header, `KeyboardAvoidingView`, biometric option |
| Register | Same component | Separate screen, role picker, multi-step |
| Forgot Password | `forgot-password/page.tsx` | Email input form |
| Reset Password | `reset-password/page.tsx` | Token + new password form |

### Home Screen
- Hero → animated header with auto-scrolling `FlatList` of hero images
- Feature cards → horizontal scrollable card strip
- Featured properties → vertical `FlatList` of `PropertyCard`
- CTA for landlords → sticky bottom banner if not authenticated as landlord

### Search Screen
- Filter sidebar → **bottom sheet** (swipe up to reveal)
- Results → `FlatList` with pull-to-refresh
- Price → native slider component
- Property type / bedroom → chip selectors
- Pagination → infinite scroll via `FlatList.onEndReached`

### Property Detail Screen
- Photos → full-screen swipeable `ImageCarousel` with pinch-to-zoom
- Info → scrollable detail with sticky "Contact Landlord" button
- Reviews → collapsible list with `StarRating`
- Contact → bottom sheet with WhatsApp deep link + in-app message
- Report → bottom sheet form

### Landlord Dashboard
- Stats → horizontal scrollable stat cards with animated counters
- Listings → `SectionList` grouped by status
- Quick actions → Create Listing, View Contacts, Manage Rentals

### Create/Edit Listing (Multi-Step Wizard)
- Step indicator → swipeable with `PagerView`
- Step 1 (Details): title, description, location, price, property type picker
- Step 2 (Amenities): toggleable chip grid
- Step 3 (Photos): `expo-image-picker` — camera + gallery, drag-to-reorder, multipart upload to Cloudinary
- Step 4 (Review): summary card with "Publish" button

### Student Dashboard
- Activity feed → `FlatList` timeline
- Stats → animated stat cards
- Quick actions → Browse, Profile, Reviews

### Profile Screen
- Editable form with avatar upload (`expo-image-picker` → Cloudinary)
- Change password → expandable section
- Settings → toggles for notifications, dark mode, biometric login
- Logout → confirmation alert with `SecureStore` token cleanup

### Admin Screens (Mobile)
- **`(admin)/dashboard.tsx`** — overview stats: total users, listings, pending reports
- **`(admin)/reports.tsx`** — `FlatList` of reports with approve/dismiss actions
- **`(admin)/users.tsx`** — user list with role management, ban/unban actions
- All admin screens guarded by role check in `(admin)/_layout.tsx`

---

## Phase 5: Offline Support Architecture

### `hooks/useListings.ts`
```typescript
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
});

persistQueryClient({
  queryClient,
  persister: createAsyncStoragePersister({ storage: AsyncStorage }),
});
```

### Offline Strategy by Feature

| Feature | Offline Behavior |
|---------|-----------------|
| Browse listings | Show cached listings with stale indicator |
| Search | Show last search results from cache |
| Listing detail | Show cached detail if previously viewed |
| Create listing | Queue locally, sync on reconnect |
| Login/Register | Requires connection |
| Reviews | Require connection |

`hooks/useOfflineSync.ts` uses `@react-native-community/netinfo` to detect connectivity, drain the offline queue on reconnect, and display an offline banner.

---

## Phase 6: Push Notifications Architecture

### Mobile Side (`hooks/usePushNotifications.ts`)
1. On app start, request notification permissions
2. Get Expo push token via `expo-notifications`
3. POST token to `/api/push/register` with platform
4. On foreground: handle in-app notification display
5. On notification tap: deep-link to relevant screen

### Notification Events

| Event | Recipient | Deep Link |
|-------|-----------|-----------|
| New listing matches saved search | Student | `studenthousing://listing/{id}` |
| New inquiry received | Landlord | `studenthousing://landlord/dashboard` |
| Landlord replied to review | Student | `studenthousing://listing/{id}` |
| Report reviewed by admin | Reporter | `studenthousing://profile` |
| New report submitted | Admin | `studenthousing://admin/reports` |

---

## Phase 7: Deep Linking & Universal Links

### Schemes
- Custom: `studenthousing://`
- Universal Links (iOS): `https://housefinder.com/listing/123` → opens app
- App Links (Android): same

### Web Repo Additions Required
Add to `frontend/public/`:
- `apple-app-site-association` — iOS Universal Links
- `.well-known/assetlinks.json` — Android App Links

Both files must be served with `Content-Type: application/json` and no redirect.

---

## Phase 8: Build & Distribution

### Branch → Environment → Build Mapping

| Branch | Environment | Backend URL | EAS Profile | Distribution |
|--------|------------|-------------|-------------|-------------|
| `develop` | Staging | `staging.housefinder.com/api` | `development` | Internal QR code |
| `release/**` | UAT | `uat.housefinder.com/api` | `preview` | TestFlight + Internal Track |
| `main` | Production | `housefinder.com/api` | `production` | App Store + Google Play |
| `hotfix/**` | Production | `housefinder.com/api` | OTA only | EAS Update |

### OTA vs Full Build Decision

Use **EAS Update (OTA)** for: hotfixes, style changes, copy, JS logic.
Trigger **full EAS build** for: new native permissions, new native modules, `app.config.ts` plugin changes, Expo SDK upgrades.

---

## Phase 9: CI/CD Pipelines (Mobile Repo)

### `.github/workflows/mobile-ci.yml`
```yaml
name: Mobile CI
on:
  push:
    branches: [develop, main, 'release/**', 'hotfix/**']
  pull_request:
    branches: [develop, main]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Authenticate GitHub Packages
        run: echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" > ~/.npmrc
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npx expo export --platform android --dev false
```

### `.github/workflows/mobile-deploy.yml`
```yaml
name: Mobile Deploy
on:
  push:
    branches: [main, develop, 'release/**', 'hotfix/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Authenticate GitHub Packages
        run: echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" > ~/.npmrc
      - run: npm ci
      - name: EAS Build (release branches)
        if: startsWith(github.ref_name, 'release/')
        run: eas build --platform all --profile preview --non-interactive
      - name: EAS Build + Submit (main)
        if: github.ref_name == 'main'
        run: |
          eas build --platform all --profile production --non-interactive
          eas submit --platform all --profile production --non-interactive
      - name: EAS OTA Update (hotfix)
        if: startsWith(github.ref_name, 'hotfix/')
        run: eas update --branch production --message "Hotfix: ${{ github.sha }}"
```

### `.github/workflows/update-shared.yml`
```yaml
name: Update Shared Package
on:
  workflow_dispatch:
  schedule:
    - cron: '0 9 * * 1'
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Authenticate GitHub Packages
        run: echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" > ~/.npmrc
      - run: npm update @housing/shared
      - run: npm ci && npx tsc --noEmit
      - uses: peter-evans/create-pull-request@v6
        with:
          commit-message: "chore: update @housing/shared"
          title: "chore: update shared package"
          body: "Automated PR — updates @housing/shared. TypeScript check passed."
          branch: "chore/update-shared"
```

---

## Phase 10: Native Mobile Enhancements

| Enhancement | Library | Note |
|-------------|---------|------|
| Push Notifications | `expo-notifications` | Requires backend push endpoints (Phase 0) |
| Camera / Image Upload | `expo-image-picker` | Multipart upload to Cloudinary |
| Biometric Auth | `expo-local-authentication` | Face ID / fingerprint, preference in `SecureStore` |
| Deep Linking | Expo Router built-in | `scheme` + Universal/App Links in `app.config.ts` |
| Haptic Feedback | `expo-haptics` | Buttons, star ratings, error states |
| Pull-to-Refresh | `RefreshControl` (built-in) | All list screens |
| Infinite Scroll | `FlatList.onEndReached` | Search, feeds |
| Animations | `react-native-reanimated` | Transitions, parallax headers, card animations |
| Share | `expo-sharing` | Share listing via native share sheet |
| Splash Screen | `expo-splash-screen` | Hidden after auth state resolves |
| Offline Caching | `@tanstack/react-query` + AsyncStorage | Phase 5 |

---

## Architecture Diagram

```
┌─────────────────────── REPO 1: housing-platform ──────────────────────────┐
│                                                                             │
│  ┌───────────────┐   ┌───────────────┐   ┌──────────────────────────────┐  │
│  │   backend/    │   │  frontend/    │   │  packages/shared/            │  │
│  │  Express.js   │   │  Next.js 16   │   │  @housing/shared             │  │
│  │  REST API     │   │  Web App      │   │  api.ts, validations.ts,     │  │
│  │               │   │               │   │  utils.ts, types/            │  │
│  └───────┬───────┘   └──────┬────────┘   └──────────────┬───────────────┘  │
│          │                  │ consumes local             │ published to      │
│          │                  └────────────────────────────┘ GitHub Packages  │
│          │                                                                   │
└──────────┼───────────────────────────────────────────────────────────────┬──┘
           │ HTTP/REST                                                      │ npm install
           │                                                                │ @housing/shared
┌──────────┼───────────────── REPO 2: housing-mobile ───────────────────────┼──┐
│          │                                                                │   │
│  ┌───────▼────────────────────────────────────────────────────────────┐  │   │
│  │  Expo React Native (iOS + Android)                                 │◄─┘   │
│  │  Expo Router, @tanstack/react-query, NativeWind, SecureStore       │      │
│  └────────────────────────────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
  │  MySQL (Aiven) │    │   Cloudinary   │    │  Expo Push API │
  └────────────────┘    └────────────────┘    └────────────────┘
```

---

## Updated Code Reuse Summary

| Component | Reuse Level | How |
|-----------|-------------|-----|
| API client (`api.ts`) | **✅ 100% shared** | Via `@housing/shared` — base URL from `app.config.ts` |
| Zod validations | **✅ 100% shared** | Via `@housing/shared` — framework-agnostic |
| TypeScript types | **✅ 100% shared** | Via `@housing/shared` |
| Utility functions | **✅ 100% shared** | Via `@housing/shared` |
| Auth context logic | **~80% adapted** | `SecureStore` + token refresh replaces cookies |
| Backend API | **✅ 100%** | Push/refresh endpoints added |
| Database schema | **~95%** | `push_tokens`, `sync_metadata`, `refresh_token` added |
| UI components | **~0% (rebuilt)** | React Native — no DOM |
| CSS styles | **~10%** | Color tokens migrated to `constants/` |

---

## Migration Checklist

### Web Repo — Complete First
- [ ] Create `packages/shared/` with `api.ts`, `validations.ts`, `utils.ts`, `types/`
- [ ] Update `frontend/` to consume `@housing/shared` locally
- [ ] Add `publish-shared.yml` workflow
- [ ] Add push notification backend routes + controller
- [ ] Add token refresh endpoint
- [ ] Run `02_mobile_schema.sql` migration
- [ ] Add `apple-app-site-association` + `assetlinks.json` to `frontend/public/`
- [ ] Fix CI/CD workflow failures (Phase 0.5)
- [ ] Verify all existing tests pass after refactor

### Mobile Repo — After Web Repo Phase 0 Complete
- [ ] Initialize Expo project (`create-expo-app`)
- [ ] Configure `.npmrc` for GitHub Packages
- [ ] Install `@housing/shared` — verify imports
- [ ] Implement design system
- [ ] Implement `AuthContext.tsx` with `SecureStore` + token refresh
- [ ] Implement all screens (Phases 3–4)
- [ ] Implement offline caching (Phase 5)
- [ ] Implement push notification hooks (Phase 6)
- [ ] Configure Universal Links / App Links (Phase 7)
- [ ] Set up EAS project + `eas.json`
- [ ] Configure CI/CD workflows
- [ ] Development build on iOS + Android simulators
- [ ] Complete manual verification matrix

---

## Verification Plan

### Automated Tests
```bash
# Web repo — verify extraction didn't break anything
cd packages/shared && npm run build
cd frontend && npm test
cd backend && npm test

# Mobile
cd housing-mobile && npx tsc --noEmit
cd housing-mobile && npm run lint
cd housing-mobile && npx eas build --profile development --platform all
```

### Manual Verification Matrix

| Test Area | Steps |
|-----------|-------|
| **Auth flow** | Register → Login → Profile → Logout → Forgot Password (iOS & Android) |
| **Biometric** | Enable Face ID/fingerprint → lock → unlock |
| **Token refresh** | Let JWT expire → verify silent refresh → user stays logged in |
| **Search & browse** | Filters, infinite scroll, pull-to-refresh |
| **Listing detail** | Photos (swipe/pinch), reviews, contact, report |
| **Landlord flow** | Create listing (4 steps, camera), edit, status change, dashboard |
| **Admin flow** | View reports → approve/dismiss, users → manage roles |
| **Push notifications** | Trigger inquiry → landlord notified → tap → correct screen |
| **Offline** | Disable network → cached listings load → re-enable → refreshes |
| **Deep linking** | `studenthousing://listing/123` → app opens correct screen |
| **Universal links** | `https://housefinder.com/listing/123` on iOS → opens app |
| **OTA update** | Deploy hotfix → reopen app → update applied |
| **Dark mode** | All screens render correctly |
| **Performance** | 60fps scroll, fast transitions |

### Device Testing Matrix

| Platform | Targets |
|----------|---------|
| iOS | iPhone 14/15 simulator + physical device (iOS 16+) |
| Android | Pixel 7 emulator + physical device (Android 10+) |
