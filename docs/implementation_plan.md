# Convert Student Housing Platform to Mobile Application

## Background

The Student Housing Platform is currently a full-stack web application:
- **Frontend**: Next.js 16 + React 19 + Bootstrap 5 + Radix UI/shadcn components
- **Backend**: Express.js REST API with JWT auth, MySQL (Aiven), Cloudinary uploads
- **Features**: Role-based auth (student/landlord/admin), property listings CRUD, search & filter, reviews/ratings, reports, rental management, admin dashboard, WhatsApp contact integration

The goal is to create a native mobile application that provides all current features with a premium, mobile-native experience on both **iOS and Android**.

## User Review Required

> [!IMPORTANT]
> **Framework Choice: React Native + Expo**
> I recommend **React Native with Expo** (SDK 53) for the following reasons:
> - Your team already knows React/TypeScript — minimal learning curve
> - The existing API layer ([api.ts](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/lib/api.ts)), types, and validation schemas ([validations.ts](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/lib/validations.ts)) can be directly reused
> - The Express.js backend stays **completely unchanged** — it's already a REST API
> - Expo provides managed native modules (camera, push notifications, maps, biometrics) out of the box
> - Single codebase → builds for iOS + Android simultaneously

> [!WARNING]
> **The web frontend will remain intact.** This plan creates a **new `mobile/` directory** alongside the existing `frontend/` and `backend/` directories. The backend serves both web and mobile clients. If you'd prefer to **replace** the web frontend entirely, let me know.

> [!IMPORTANT]
> **Admin Panel Scope**: The admin dashboard is typically best kept as a web-only tool. I recommend **excluding** the admin panel from the mobile app and keeping it web-only. If you want admin features in the mobile app as well, let me know.

## Open Questions

> [!IMPORTANT]
> 1. **Target platforms**: Should we support both iOS and Android, or prioritize one?
> 2. **App distribution**: Will you distribute via App Store / Google Play, or use Expo EAS for internal/beta testing?
> 3. **Push notifications**: Do you want real-time push notifications for new messages, listing updates, etc.?
> 4. **Map integration**: Should property locations be shown on an interactive map (Google Maps / Apple Maps)?
> 5. **Offline support**: Do you need any offline functionality (e.g., cached listings for browsing without internet)?
> 6. **Admin on mobile**: Should the admin dashboard be included in the mobile app, or remain web-only?

## Anwsers to open questions

[!IMPORTANT]
> 1. The app should support both platforms
> 2. Use Expo EAS
> 3. Yes
> 4. No
> 5. Yes
> 6. Yes

---

## Proposed Changes

### Phase 1: Project Scaffolding & Core Setup

#### [NEW] `mobile/` — Expo React Native Project

Initialize a new Expo project in the workspace root:

```
mobile/
├── app/                      # Expo Router file-based routing (mirrors Next.js pattern)
│   ├── _layout.tsx           # Root layout with navigation providers
│   ├── index.tsx             # Landing / home screen
│   ├── (auth)/               # Auth group (unauthenticated screens)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/               # Main app tab navigator (authenticated)
│   │   ├── _layout.tsx       # Bottom tab bar config
│   │   ├── home.tsx          # Home / featured listings
│   │   ├── search.tsx        # Search & filter
│   │   ├── dashboard.tsx     # Role-based dashboard
│   │   └── profile.tsx       # Profile & settings
│   ├── listing/
│   │   └── [id].tsx          # Property detail screen
│   └── landlord/
│       ├── create-listing.tsx
│       └── edit-listing/
│           └── [id].tsx
├── components/               # Reusable mobile components
│   ├── PropertyCard.tsx
│   ├── StarRating.tsx
│   ├── FilterSheet.tsx       # Bottom sheet filter (replaces sidebar)
│   ├── ImageCarousel.tsx
│   ├── ReviewItem.tsx
│   ├── ContactModal.tsx
│   ├── ReportModal.tsx
│   ├── LoadingOverlay.tsx
│   ├── EmptyState.tsx
│   └── ui/                   # Design system primitives
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       ├── BottomSheet.tsx
│       └── Toast.tsx
├── contexts/
│   └── AuthContext.tsx        # Adapted from web (SecureStore instead of cookies)
├── lib/
│   ├── api.ts                # Reused from web with minimal changes
│   ├── validations.ts        # Directly reused from web (Zod schemas)
│   ├── utils.ts              # Reused from web
│   └── storage.ts            # Async storage / SecureStore helpers
├── hooks/
│   ├── useAuth.ts
│   ├── useListings.ts
│   └── useTheme.ts
├── constants/
│   ├── colors.ts             # Brand palette (magenta, coral, gold, teal, ink, violet)
│   ├── typography.ts
│   └── layout.ts
├── assets/                   # App icon, splash screen, fonts
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
├── app.json                  # Expo configuration
├── package.json
├── tsconfig.json
├── babel.config.js
└── eas.json                  # Expo EAS Build configuration
```

#### Key Setup Files

| File | Purpose |
|------|---------|
| `app.json` | Expo config: app name, slug, SDK version, splash screen, icons, permissions |
| `package.json` | Dependencies: expo, expo-router, react-native, nativewind, expo-secure-store, expo-image-picker, etc. |
| `tsconfig.json` | TypeScript config matching the web frontend's strictness |
| `eas.json` | Build profiles for development, preview, and production |

---

### Phase 2: Design System & Theming

#### [NEW] `mobile/constants/colors.ts`

Migrate the brand palette from [globals.css](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/globals.css):

```typescript
export const Colors = {
  brand: {
    magenta: '#ef3d83',
    coral: '#ff7a59',
    gold: '#ffd166',
    teal: '#00b894',
    ink: '#251b3d',
    violet: '#6c4df6',
  },
  // Light & dark mode palettes
  light: { background: '#fff7fb', card: 'rgba(255,255,255,0.82)', ... },
  dark:  { background: '#1a1225', card: 'rgba(40,30,60,0.82)', ... },
};
```

#### [NEW] `mobile/components/ui/*.tsx`

Build a mobile-native design system using **React Native's built-in components** + `react-native-reanimated` for animations. These replace the 57 shadcn/ui web components with mobile equivalents focused on:
- `Button` — gradient backgrounds (LinearGradient), haptic feedback
- `Input` — styled TextInput with validation states
- `Card` — glassmorphism effect with `BlurView`
- `BottomSheet` — replaces web modals/dialogs (using `@gorhom/bottom-sheet`)
- `Toast` — native toast notifications (using `react-native-toast-message`)

---

### Phase 3: Authentication & Navigation

#### [NEW] `mobile/contexts/AuthContext.tsx`

Adapted from [AuthContext.tsx](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/contexts/AuthContext.tsx) with these changes:

| Web (Current) | Mobile (New) |
|---------------|-------------|
| `js-cookie` for cookie storage | `expo-secure-store` for encrypted token storage |
| `sessionStorage` for session tokens | `SecureStore` (persists across app restarts) |
| Next.js middleware for route protection | Expo Router `redirect` in layout files |
| `Cookies.set('authToken', ...)` | `SecureStore.setItemAsync('auth_token', ...)` |

The auth flow, API calls, and user state management logic remain **identical**.

#### [NEW] `mobile/app/_layout.tsx`

Root layout implementing:
- `AuthProvider` wrapping the entire app
- Navigation structure: auth screens (stack) vs. main app (tabs)
- Automatic redirect: unauthenticated → login, authenticated → role-based dashboard
- This replaces the web's [middleware.ts](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/middleware.ts) route protection logic

#### [NEW] `mobile/app/(tabs)/_layout.tsx`

Bottom tab navigator with role-based tabs:

| Tab | Student | Landlord |
|-----|---------|----------|
| 🏠 Home | Featured listings | Featured listings |
| 🔍 Search | Search & filter | Search & filter |
| 📊 Dashboard | Student dashboard | Landlord dashboard + listings management |
| 👤 Profile | Profile & settings | Profile & settings |

Landlords get an additional **floating action button (FAB)** for quick "Create Listing".

---

### Phase 4: Screen-by-Screen Migration

#### Auth Screens (from [login/](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/login), [register/](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/register), [forgot-password/](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/forgot-password), [reset-password/](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/reset-password))

| Screen | Web Source | Mobile Adaptation |
|--------|-----------|-------------------|
| Login | [AuthSlidingPanel.tsx](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/components/AuthSlidingPanel.tsx) (sliding login/register) | Separate login screen with gradient header, `KeyboardAvoidingView`, biometric login option |
| Register | Same component | Separate register screen with role picker (Student/Landlord), multi-step form |
| Forgot Password | `forgot-password/page.tsx` | Simple form with email input |
| Reset Password | `reset-password/page.tsx` | OTP/token input + new password form |

#### Home Screen (from [page.tsx](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/page.tsx))

- Hero section → animated header with auto-scrolling `FlatList` of hero images
- Feature cards → horizontal scrollable card strip
- Featured properties → vertical `FlatList` of `PropertyCard` components
- CTA for landlords → sticky bottom banner (if not authenticated as landlord)

#### Search Screen (from [search/page.tsx](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/search/page.tsx))

- Filter sidebar → **bottom sheet** filter (swipe up to reveal filters)
- Results grid → `FlatList` with pull-to-refresh
- Price slider → native slider component
- Property type / bedroom filters → chip selectors
- Pagination → infinite scroll with loading indicator

#### Property Detail (from `listings/[id]/page.tsx`)

- Photo gallery → full-screen swipeable `ImageCarousel` with pinch-to-zoom
- Property info → scrollable detail view with sticky "Contact Landlord" button at bottom
- Reviews → collapsible list with star rating display
- Contact modal → bottom sheet with WhatsApp deep link + in-app message
- Report → bottom sheet form

#### Landlord Dashboard (from [landlord/dashboard/](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/landlord/dashboard))

- Stats cards → horizontal scrollable stat cards with animated counters
- Listings table → `SectionList` grouped by status (Available, Rented, Under Negotiation)
- Quick actions → action buttons (Create Listing, View Contacts, Manage Rentals)

#### Create/Edit Listing (from [landlord/listings/create/](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/landlord/listings/create))

- Multi-step wizard → swipeable step indicator with `PagerView`
- Step 1 (Details): TextInputs for title, description, location, price, property type picker
- Step 2 (Amenities): Checkbox grid → toggleable chip list
- Step 3 (Photos): `expo-image-picker` with camera + gallery access, drag-to-reorder
- Step 4 (Review): Summary card with "Publish" button

#### Student Dashboard (from [student/dashboard/](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/student/dashboard))

- Activity feed → `FlatList` timeline
- Stats → animated stat cards
- Quick actions → action grid (Browse, Profile, Reviews)

#### Profile Screen (from [profile/](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/app/profile))

- Profile info → editable form with avatar upload (`expo-image-picker`)
- Change password → expandable section
- Settings → toggle list (notifications, dark mode, biometric login)
- Logout → confirmation alert

---

### Phase 5: API Layer & Shared Code

#### [NEW] `mobile/lib/api.ts`

Directly adapted from [api.ts](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/lib/api.ts) with minimal changes:

```diff
- const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
+ import Constants from 'expo-constants';
+ const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';
```

```diff
  // Token injection changes
- import Cookies from 'js-cookie';
+ import * as SecureStore from 'expo-secure-store';

  // In apiRequest():
- credentials: 'include',
+ // No credentials needed — token sent via Authorization header (already implemented)
```

All API endpoint functions (`authApi`, `listingsApi`, `reviewsApi`, `reportsApi`, `rentalsApi`, `contactsApi`, `adminApi`) are **directly reused** with zero changes — they already use the `Authorization: Bearer <token>` pattern.

#### [REUSE] `mobile/lib/validations.ts`

Copied directly from [validations.ts](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/lib/validations.ts) — Zod schemas are framework-agnostic.

#### [REUSE] `mobile/lib/utils.ts`

Copied directly from [utils.ts](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/frontend/lib/utils.ts).

---

### Phase 6: Native Mobile Enhancements

These are features that make the mobile app feel truly native, going beyond a simple port of the web app:

| Enhancement | Library | Description |
|-------------|---------|-------------|
| **Push Notifications** | `expo-notifications` | Notify students of new listings, landlords of inquiries |
| **Camera Integration** | `expo-image-picker` | Take photos directly for listings (instead of file upload) |
| **Biometric Auth** | `expo-local-authentication` | Face ID / fingerprint to unlock the app |
| **Maps** | `react-native-maps` | Show property locations on interactive map |
| **Deep Linking** | Expo Router built-in | Open specific listings from shared links |
| **Haptic Feedback** | `expo-haptics` | Tactile feedback on button presses, ratings |
| **Pull-to-Refresh** | Built-in `RefreshControl` | Refresh listings, dashboard data |
| **Infinite Scroll** | `FlatList.onEndReached` | Paginate search results seamlessly |
| **Animations** | `react-native-reanimated` | Smooth transitions, parallax headers, card animations |
| **Share** | `expo-sharing` / `react-native-share` | Share listings via WhatsApp, social media |
| **Splash Screen** | `expo-splash-screen` | Branded animated splash screen |

---

### Phase 7: Backend Updates (Minimal)

The existing backend requires only **minor** changes to support mobile clients:

#### [MODIFY] [app.js](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/backend/src/app.js)

Update CORS configuration to allow mobile app requests (mobile apps send requests without an `origin` header, which is already handled by the existing `if (!origin) return callback(null, true);` line on line 48). **No change actually needed.**

#### [NEW] `backend/src/Routes/pushRoutes.js` (Optional — if push notifications are wanted)

New endpoint for registering device push tokens:
- `POST /api/push/register` — Register Expo push token for a user
- `POST /api/push/unregister` — Remove push token on logout

#### [NEW] `backend/src/controllers/pushController.js` (Optional)

Controller to store and manage push tokens, send notifications via Expo Push API.

#### [MODIFY] Database — Add `push_tokens` table (Optional)

```sql
CREATE TABLE push_tokens (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  token       VARCHAR(255)  NOT NULL UNIQUE,
  platform    ENUM('ios','android') NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

### Phase 8: Build & Distribution

#### [NEW] `mobile/eas.json`

Expo EAS Build configuration for:
- **Development** builds (internal testing with dev client)
- **Preview** builds (stakeholder testing via QR code)
- **Production** builds (App Store / Google Play submission)

#### [NEW] `mobile/app.json`

Expo configuration including:
- App name: "Student Housing"
- Bundle identifiers (iOS: `com.studenthousing.app`, Android: `com.studenthousing.app`)
- Permissions: camera, photo library, location, notifications
- Splash screen & icon configuration
- Deep link scheme: `studenthousing://`

---

## Migration Summary

```mermaid
graph TB
    subgraph "Current Architecture"
        WEB["Next.js Frontend<br/>(Browser)"]
        API["Express.js Backend<br/>(REST API)"]
        DB["MySQL Database<br/>(Aiven)"]
        CLOUD["Cloudinary<br/>(Image Storage)"]
        WEB -->|HTTP/REST| API
        API --> DB
        API --> CLOUD
    end

    subgraph "New Architecture"
        WEB2["Next.js Frontend<br/>(Web - Unchanged)"]
        MOBILE["React Native App<br/>(iOS + Android)"]
        API2["Express.js Backend<br/>(REST API - Minimal Changes)"]
        DB2["MySQL Database<br/>(Aiven - Unchanged)"]
        CLOUD2["Cloudinary<br/>(Unchanged)"]
        WEB2 -->|HTTP/REST| API2
        MOBILE -->|HTTP/REST| API2
        API2 --> DB2
        API2 --> CLOUD2
    end
```

### Code Reuse Summary

| Component | Reuse Level | Notes |
|-----------|-------------|-------|
| API client (`api.ts`) | **~95%** | Only base URL and storage mechanism change |
| Zod validations | **100%** | Framework-agnostic, direct copy |
| Utility functions | **100%** | Direct copy |
| Auth context logic | **~80%** | Same flow, different storage (SecureStore vs cookies) |
| Backend API | **100%** | No changes needed for mobile support |
| Backend routes | **100%** | REST API serves both web and mobile |
| Database schema | **100%** | Unchanged (optional push_tokens table) |
| UI components | **~0%** | Must be rebuilt with React Native components |
| CSS styles | **~10%** | Color values and spacing tokens reused as constants |

---

## Deployment Strategy & CI/CD Walkthrough

This walkthrough outlines the complete deployment lifecycle for both the web applications (frontend/backend) and the new mobile applications (iOS/Android). It also resolves the validation failures in the current CI/CD pipelines.

### 1. Web & Backend Environments Model

Deployments are mapped dynamically from Git branches to targeted environments via SSH-based docker-compose scripts:

| Git Branch | Targeted Environment | Server Host Address | Deployment Strategy |
|:---|:---|:---|:---|
| `develop` | **Staging** | `staging.housefinder.com` | Automated on push. Runs migrations & restarts Docker containers. |
| `release/**` | **UAT (User Acceptance Testing)** | `uat.housefinder.com` | Automated on push. Used for final QA & signoff. |
| `main` / `hotfix/**` | **Production** | `housefinder.com` | Automated on push/merge. Production database schema update. |

---

### 2. CI/CD Pipeline Workflow (GitHub Actions)

A unified integration flow ensures code validation and automated deployment triggers:

```mermaid
graph TD
    A[Developer Push] -->|Triggers CI| B(GitHub Actions)
    
    subgraph "Verification Pipelines"
        B --> C1[Frontend CI]
        B --> C2[Backend CI]
        B --> C3[Mobile CI]
    end
    
    C1 -->|Lint, Type-check, Jest Test| D1[Frontend Build Artifact]
    C2 -->|Lint, local MySQL Integration Test| D2[Backend Validated]
    C3 -->|TS check, Lint, Expo Prebuild| D3[Mobile Client Validated]
    
    D1 & D2 & D3 -->|All Success| E[Deploy Trigger]
    
    subgraph "Deployment Strategy"
        E -->|Main / Develop Branch| F1[SSH & Docker Compose Web/Backend]
        E -->|App Release / Tags| F2[Expo EAS Build & Submit]
        E -->|JS/Assets Hotfix| F3[EAS OTA Update]
    end
```

---

### 3. Mobile Deployment Strategy (Expo & EAS)

To deliver a premium mobile app experience with zero disruption, we leverage **Expo Application Services (EAS)**:

#### A. Multi-Profile Build Structure (`eas.json`)
The application configuration maintains three distinct profiles to segregate environments:
- **`development`**: Builds an internal development client allowing devs to scan a QR code and connect to local/staging servers directly with full debug tooling.
- **`preview`**: Builds a release-ready APK/AAB (Android) or Ad-Hoc/TestFlight ipa (iOS) linked to the staging/UAT backend for stakeholder review.
- **`production`**: Builds the highly optimized store-ready bundle pointing to the production Express.js backend.

#### B. Over-the-Air (OTA) Updates (`expo-updates`)
- **Use Case**: Critical hotfixes, style updates, copy adjustments, and minor JS improvements.
- **Advantage**: Bypasses App Store / Google Play review times completely. Users receive the update instantly upon reopening the app.
- **Configuration**: Uses channel-based routing matching the environment (`staging`, `production`).

#### C. Full App Store Submission Lifecycle
For native changes (e.g., adding a native permission/module in `app.json` like camera or notifications):
1. **Trigger EAS Build**: Build production artifact via `eas build --platform all --profile production`.
2. **App Store Connect / Google Play Console**: EAS automatically uploads the build via `eas submit` or fastlane credentials.
3. **Internal Testing**: Distribute to TestFlight (iOS) and Google Play Console Internal Test Track (Android).
4. **Phased Production Rollout**: Submit for store review with a 7-day phased rollout to safely verify production usage.

---

### 4. Proposed Fixes for Current Workflow Failures

To ensure workflow validation passes (`validate_workflows.py`), the following changes will be applied during the implementation phase:

#### [MODIFY] [.github/workflows/frontend-ci.yml](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/.github/workflows/frontend-ci.yml)
Fix the artifact upload path prefixing issue to ensure they are relative to the root context of the validator:
```diff
       - name: Upload build artifact
         if: ${{ github.ref_name == 'develop' || github.ref_name == 'main' || startsWith(github.ref_name, 'release/') || startsWith(github.ref_name, 'hotfix/') }}
         uses: actions/upload-artifact@v4
         with:
           name: frontend-build-${{ github.sha }}
           path: |
-            .next/
-            public/
+            frontend/.next/
+            frontend/public/
           retention-days: 1
```

#### [MODIFY] [.github/workflows/backend-ci.yml](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/.github/workflows/backend-ci.yml)
Update the integration test suite to point to the local isolated MySQL container instead of external/Aiven databases, and fix the artifact coverage prefix path:
```diff
     env:
       NODE_ENV: test
-      DATABASE_URL: ${{ secrets.DATABASE_URL }}
+      DATABASE_URL: mysql://appuser:apppassword@127.0.0.1:3306/student_housing_test
       JWT_SECRET: ${{ secrets.JWT_SECRET }}
```
```diff
       - name: Upload coverage artifact
         if: ${{ github.ref_name == 'develop' || github.ref_name == 'main' || startsWith(github.ref_name, 'release/') || startsWith(github.ref_name, 'hotfix/') }}
         uses: actions/upload-artifact@v4
         with:
           name: backend-coverage-${{ github.sha }}
-          path: coverage/
+          path: backend/coverage/
           retention-days: 7
```

#### [MODIFY] [.github/workflows/deploy.yml](file:///c:/Users/USER/Documents/Wado%20T.S/Capstone%20Project/.github/workflows/deploy.yml)
Inject the missing `is_production` output expected by the validator into the `resolve-env` workflow job:
```diff
   resolve-env:
     runs-on: ubuntu-latest
     outputs:
       env_name: ${{ steps.env-map.outputs.env_name }}
+      is_production: ${{ steps.env-map.outputs.is_production }}
     steps:
       - id: env-map
         run: |
           case "${GITHUB_REF_NAME}" in
-            develop)   echo "env_name=staging" >> $GITHUB_OUTPUT ;;
-            release/*) echo "env_name=uat" >> $GITHUB_OUTPUT ;;
-            main|hotfix/*) echo "env_name=production" >> $GITHUB_OUTPUT ;;
-            *)         echo "env_name=none" >> $GITHUB_OUTPUT ;;
+            develop)
+              echo "env_name=staging" >> $GITHUB_OUTPUT
+              echo "is_production=false" >> $GITHUB_OUTPUT
+              ;;
+            release/*)
+              echo "env_name=uat" >> $GITHUB_OUTPUT
+              echo "is_production=false" >> $GITHUB_OUTPUT
+              ;;
+            main|hotfix/*)
+              echo "env_name=production" >> $GITHUB_OUTPUT
+              echo "is_production=true" >> $GITHUB_OUTPUT
+              ;;
+            *)
+              echo "env_name=none" >> $GITHUB_OUTPUT
+              echo "is_production=false" >> $GITHUB_OUTPUT
+              ;;
           esac
```

---

## Verification Plan

### Automated Tests

```bash
# Run existing backend tests (should all pass — backend unchanged)
cd backend && npm test

# Run mobile app type checking
cd mobile && npx tsc --noEmit

# Run mobile app linting
cd mobile && npm run lint

# Build development client for testing
cd mobile && npx eas build --profile development --platform all
```

### Manual Verification

| Test Area | Steps |
|-----------|-------|
| **Auth flow** | Register → Login → Profile → Logout → Forgot Password on both iOS & Android |
| **Search & browse** | Search listings with filters, infinite scroll, pull-to-refresh |
| **Listing detail** | View photos (swipe), read reviews, contact landlord, report listing |
| **Landlord flow** | Create listing (all 4 steps with photo capture), edit, change status, view dashboard |
| **Student flow** | Browse → view detail → contact → review → dashboard |
| **Deep linking** | Open `studenthousing://listing/123` from external app |
| **Offline behavior** | Graceful error messages when API is unreachable |
| **Performance** | Smooth 60fps scrolling, fast screen transitions |
| **Dark mode** | All screens render correctly in light and dark themes |

### Device Testing Matrix

| Platform | Devices |
|----------|---------|
| iOS | iPhone 14/15 simulator, physical device if available |
| Android | Pixel 7 emulator, physical device if available |
