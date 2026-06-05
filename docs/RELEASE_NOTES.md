# Release v1.0.0 – Student‑Housing Platform

*Date: 2026‑05‑08*

---

## 🚀 New Features

| Feature | Description |
|---------|-------------|
| **Feature‑01 – User Registration** | Added `/register` page, reusable `AuthSlidingPanel` UI component, tenant‑verification UI, validation helpers, and snapshot assets. |
| **Feature‑02 – Login / Logout UI** | Added `/login` page, `ProtectedRoute` guard, `BootstrapClient` helper, `AuthContext` provider, and login‑page snapshots. |
| **Feature‑03 – Multi‑step Listing Creation** | Implemented landlord listing‑creation wizard (`/landlord/listings/create`), edit page for existing listings, and reusable `ImageUpload` component. |
| **Feature‑04 – Property‑Status Management** | Admin listings page, landlord edit page (status toggle), landlord rentals page, and backend routes & controllers for listings & rentals. |
| **Feature‑05 – Search & Filter UI** | Search page (`/search`) with `FiltersSidebar`, `PropertyCard`, and `Pagination` components; CSV export support via API. |
| **Feature‑06 – Property Detail Page** | Detailed listing view (`/listings/[id]`) with contact‑modal, reviews, star‑rating UI, plus new backend routes/controllers for amenities and contact handling. |
| **Feature‑07 – Student Dashboard** | Student dashboard and profile pages, toast & mobile detection hooks, reusable loading spinner and error‑alert components. |
| **Feature‑08 – Landlord Dashboard** | Landlord dashboard and contacts management pages, admin‑metrics route, and metrics controller for platform statistics. |
| **Feature‑19 – Forgot / Reset Password** | Forgot‑password and reset‑password pages with email‑reset flow and related snapshots. |
| **Feature‑20 – Guest‑Preview / Home Page** | Public home page, generic 404 page, site‑wide `Navbar` and `Footer` components, plus snapshot. |
| **Feature‑21 – Review & Rating Submission UI** | Admin reviews page, shared `Reviews` & `StarRating` components (primary owner: this branch). |
| **Feature‑22 – Report Submission UI** | Admin reports page and reusable `ReportModal` component. |
| **Shared/Common Updates** | Global layout (`app/layout.tsx`), global CSS, Next‑config, Dockerfile, CI/workflow files, documentation (`DEPLOYMENT.md`, `PROJECT_SUMMARY.md`, `QUICK_START.md`), UI primitive library, API helper lib, and extensive snapshot library. |

## 🛠️ Improvements & Refactors

- **Metrics Controller** – Added CSV export, unified stats payload, and robust error handling.
- **Contact Controller** – Implemented WhatsApp URL generation, email notification (via lazy‑loaded config), conversation‑creation logic with idempotent handling.
- **Listing Controller** – Added payload validation, amenity handling (creation & linking), photo upload via Cloudinary, intelligent status updates, pagination meta for search, and random‑listings endpoint.
- **Dashboard Controllers** – Added landlord & student dashboard data aggregation (stats, recent activity, contacts).
- **Auth & Password‑Reset** – Added validation, token generation, and email‑sending flow (with graceful error logging).

## 🐞 Bug Fixes

| Area | Fix |
|------|-----|
| **Metrics Tests** | Adjusted test expectations to match new stats fields (`total_users`, `total_listings`, `active_rentals`, `total_reports`, `flagged_content`). |
| **Contact Tests** | Updated mock data to include required fields (`landlordPhone`, `studentFullName`) and ensured proper status codes (201/200). |
| **Listing Creation Tests** | Fixed mock insert‑result shape, added amenity‑linking mock handling, and accounted for optional fields. |
| **Search Listings Tests** | Corrected pagination meta shape (`meta` object) and ensured status 200. |

---
