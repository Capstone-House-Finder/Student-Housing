# GitHub Issues Proposal

> Derived from User Stories US-01 to US-19
> Roles covered: **Frontend** | **Backend** | **DevOps** | **QA**

---

## Table of Contents

- [Frontend Issues](#frontend-issues)
- [Backend Issues](#backend-issues)
- [DevOps Issues](#devops-issues)
- [QA Issues](#qa-issues)

---

## Frontend Issues

> Issues assigned to the Frontend team, derived from the platform user stories.

---

### FE-01 – Build user registration form

| Field | Details |
|---|---|
| **Issue ID** | FE-01 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-01 |
| **Labels** | `frontend` `auth` `US-01` |

**Description**

Implement the registration page with fields for email and password. The form must validate inputs client-side before submission, show inline error messages for invalid or duplicate emails, and display a success confirmation after registration.

**Acceptance Criteria**

- [ ] Email format is validated before the form is submitted.
- [ ] Password meets minimum strength requirements (shown to the user).
- [ ] Duplicate email error received from the API is displayed inline.
- [ ] A success banner or redirect occurs after successful registration.

**Technical Notes**

- Use React Hook Form + Zod for validation.
- `POST /api/auth/register`
- Handle `409 Conflict` for duplicate email.

---

### FE-02 – Build login and logout UI

| Field | Details |
|---|---|
| **Issue ID** | FE-02 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-02 |
| **Labels** | `frontend` `auth` `US-02` |

**Description**

Create the login page with email and password fields. On success, store the JWT and redirect the user to their dashboard. Implement logout by clearing the token and redirecting to the login page.

**Acceptance Criteria**

- [ ] Invalid credentials show a clear error message.
- [ ] JWT is stored securely (httpOnly cookie or memory, not localStorage).
- [ ] Logout clears the session and prevents back-navigation to protected pages.

**Technical Notes**

- `POST /api/auth/login`
- Use Next.js middleware to protect routes.
- Redirect unauthenticated users to `/login`.

---

### FE-03 – Build forgot password and reset password pages

| Field | Details |
|---|---|
| **Issue ID** | FE-03 |
| **Role** | Frontend |
| **Priority** | 🟡 Medium |
| **Related US** | US-03 |
| **Labels** | `frontend` `auth` `US-03` |

**Description**

Create a Forgot Password page where the user submits their email to receive a reset link. Create a Reset Password page (accessed via the link in the email) where the user sets a new password.

**Acceptance Criteria**

- [ ] Submitting an unregistered email shows an appropriate message without revealing account existence.
- [ ] The reset form validates that both password fields match.
- [ ] After successful reset, the user is redirected to the login page.

**Technical Notes**

- `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`
- The reset token comes as a URL query parameter.

---

### FE-04 – Build multi-step listing creation form

| Field | Details |
|---|---|
| **Issue ID** | FE-04 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-04, US-05 |
| **Labels** | `frontend` `listings` `US-04` `US-05` |

**Description**

Implement the multi-step form for landlords to create a property listing. Steps:
1. Basic details — title, description, location, price, property type.
2. Amenities selection.
3. Photo upload with preview.
4. Review and submit.

**Acceptance Criteria**

- [ ] Each step validates its fields before advancing.
- [ ] Photos are previewed before upload and limited to the allowed count.
- [ ] The completed listing is visible on the platform immediately after submission.
- [ ] Incomplete listings cannot be submitted.

**Technical Notes**

- `POST /api/listings`, then `POST /api/listings/:id/photos`
- Use Cloudinary for photo upload.
- Persist step state so refreshing does not lose progress (use `sessionStorage` or React state).

---

### FE-05 – Build property status management UI

| Field | Details |
|---|---|
| **Issue ID** | FE-05 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-06 |
| **Labels** | `frontend` `listings` `US-06` |

**Description**

Add a status selector to the landlord's listing management page. The selector must only show the approved statuses: Available, Rented, Under Negotiation. The updated status should be reflected immediately on the listing card.

**Acceptance Criteria**

- [ ] Only approved statuses are presented as options.
- [ ] Selecting a status triggers a PATCH request and updates the UI without a full reload.
- [ ] Students viewing the listing see the updated status.

**Technical Notes**

- `PATCH /api/listings/:id/status`
- Use optimistic UI update.

---

### FE-06 – Build property search and filter interface

| Field | Details |
|---|---|
| **Issue ID** | FE-06 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-07 |
| **Labels** | `frontend` `search` `US-07` |

**Description**

Implement the search page with filter controls for location, budget range, property type, amenities, and availability. Results should update reactively as filters are applied, support sorting, and show a "No results found" message when appropriate.

**Acceptance Criteria**

- [ ] Filters can be combined freely.
- [ ] Results reflect all active filters without requiring a page reload.
- [ ] Properties can be sorted by price, date listed, or distance.
- [ ] A clear empty-state message appears when no results match.

**Technical Notes**

- `GET /api/listings?location=...&maxPrice=...&type=...&amenities=...`
- Debounce filter changes to avoid excessive API calls.
- Use URL query params so filtered views are shareable.

---

### FE-07 – Build guest property preview page

| Field | Details |
|---|---|
| **Issue ID** | FE-07 |
| **Role** | Frontend |
| **Priority** | 🟡 Medium |
| **Related US** | US-08 |
| **Labels** | `frontend` `listings` `guest` `US-08` |

**Description**

Implement a landing/home page that shows a limited set of recent property previews to unauthenticated visitors. Full listing details and interaction features (contact, save) must remain behind authentication.

**Acceptance Criteria**

- [ ] Recent listings display as preview cards (photo, title, price, location).
- [ ] Clicking a card prompts the guest to register or log in.
- [ ] No contact or save actions are available to guests.

**Technical Notes**

- `GET /api/listings/preview` (public endpoint, no auth required)
- Use Next.js static generation or ISR for performance.

---

### FE-08 – Build property detail page

| Field | Details |
|---|---|
| **Issue ID** | FE-08 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-09 |
| **Labels** | `frontend` `listings` `US-09` |

**Description**

Create the full property detail page showing the photo gallery, description, amenities list, price, property type, landlord info, and a contact button. The page must be clearly laid out and mobile-responsive.

**Acceptance Criteria**

- [ ] All listing fields are displayed correctly.
- [ ] The photo gallery supports multiple images.
- [ ] The contact button is prominently visible.
- [ ] The page renders correctly on mobile and desktop.

**Technical Notes**

- `GET /api/listings/:id`
- Use Next.js dynamic routes: `/listings/[id]`.

---

### FE-09 – Build student dashboard

| Field | Details |
|---|---|
| **Issue ID** | FE-09 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-11 |
| **Labels** | `frontend` `dashboard` `US-11` |

**Description**

Implement the student dashboard showing properties under negotiation, currently rented properties, and past rental history. Each entry should link to the relevant property page.

**Acceptance Criteria**

- [ ] Dashboard sections are clearly separated.
- [ ] Each record links to the corresponding property.
- [ ] Both current and past rentals are shown.

**Technical Notes**

- `GET /api/students/me/dashboard`
- Route: `/student/dashboard`

---

### FE-10 – Build landlord dashboard

| Field | Details |
|---|---|
| **Issue ID** | FE-10 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-15 |
| **Labels** | `frontend` `dashboard` `US-15` |

**Description**

Implement the landlord dashboard showing all their properties with current status and the list of interested students per property.

**Acceptance Criteria**

- [ ] Each property card shows title, status, and a count of interested students.
- [ ] The landlord can navigate to edit a listing or view interested students from the dashboard.
- [ ] Status can be updated directly from the dashboard.

**Technical Notes**

- `GET /api/landlords/me/dashboard`
- Route: `/landlord/dashboard`

---

### FE-11 – Build review and rating submission UI

| Field | Details |
|---|---|
| **Issue ID** | FE-11 |
| **Role** | Frontend |
| **Priority** | 🟡 Medium |
| **Related US** | US-13 |
| **Labels** | `frontend` `reviews` `US-13` |

**Description**

Add a review form to the property detail page, visible only to students with a confirmed rental for that property. The form includes a star rating (required) and a written comment. Landlord reply functionality should also be implemented.

**Acceptance Criteria**

- [ ] The review form is hidden for students without a confirmed rental.
- [ ] A star rating is required before submission.
- [ ] Submitted reviews appear on the property page.
- [ ] Landlords see a Reply button (one reply per review).

**Technical Notes**

- `POST /api/listings/:id/reviews`
- `POST /api/reviews/:reviewId/reply`

---

### FE-12 – Build report listing/account UI

| Field | Details |
|---|---|
| **Issue ID** | FE-12 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-14 |
| **Labels** | `frontend` `moderation` `US-14` |

**Description**

Add a Report button to listing detail pages and user profiles. Clicking it opens a modal where the student describes the issue and submits the report. A confirmation message is shown after submission.

**Acceptance Criteria**

- [ ] The report modal is accessible from the listing detail page.
- [ ] The student must provide a reason before submitting.
- [ ] A confirmation message is shown after successful submission.

**Technical Notes**

- `POST /api/reports`
- Do not expose who submitted the report.

---

## Backend Issues

> Issues assigned to the Backend team, covering API design, business logic, and data integrity.

---

### BE-01 – Implement user registration endpoint

| Field | Details |
|---|---|
| **Issue ID** | BE-01 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-01 |
| **Labels** | `backend` `auth` `US-01` |

**Description**

Create the `POST /api/auth/register` endpoint. Validate email format and password strength, reject duplicate emails with a 409 response, hash the password with bcrypt, and return a JWT on success.

**Acceptance Criteria**

- [ ] Returns `201` on success with a JWT.
- [ ] Returns `409` if the email is already registered.
- [ ] Returns `400` for invalid email or weak password.
- [ ] Password is hashed before storage (never stored in plain text).

**Technical Notes**

- Use bcrypt (`saltRounds = 12`).
- JWT payload: `{ id, role }`.
- Store user in the `users` table.

---

### BE-02 – Implement login, logout, and JWT middleware

| Field | Details |
|---|---|
| **Issue ID** | BE-02 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-02 |
| **Labels** | `backend` `auth` `US-02` |

**Description**

Create `POST /api/auth/login` to authenticate users and return a signed JWT. Create `POST /api/auth/logout` (invalidate token if using a blocklist). Implement an Express middleware that verifies the JWT on protected routes.

**Acceptance Criteria**

- [ ] Returns `200` + JWT on valid credentials.
- [ ] Returns `401` on invalid credentials.
- [ ] Protected routes return `401` if the token is missing or expired.
- [ ] Logout invalidates the token server-side if a blocklist strategy is used.

**Technical Notes**

- Sign JWT with RS256 or HS256; store secret in env.
- Token expiry: 7 days.
- Attach decoded user to `req.user` in middleware.

---

### BE-03 – Implement password reset flow

| Field | Details |
|---|---|
| **Issue ID** | BE-03 |
| **Role** | Backend |
| **Priority** | 🟡 Medium |
| **Related US** | US-03 |
| **Labels** | `backend` `auth` `US-03` |

**Description**

Implement `POST /api/auth/forgot-password` to generate a time-limited reset token and send it by email. Implement `POST /api/auth/reset-password` to validate the token and update the password.

**Acceptance Criteria**

- [ ] Reset token expires after 1 hour.
- [ ] Attempting to use an expired or invalid token returns `400`.
- [ ] Password is re-hashed before storage.
- [ ] The endpoint does not reveal whether an email is registered.

**Technical Notes**

- Use `crypto.randomBytes(32)` for the token.
- Store hashed token + expiry in the DB.
- Send email via Nodemailer or an email service (SendGrid, etc.).

---

### BE-04 – Implement listing CRUD endpoints

| Field | Details |
|---|---|
| **Issue ID** | BE-04 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-04 |
| **Labels** | `backend` `listings` `US-04` |

**Description**

Implement the full CRUD for property listings: `POST /api/listings`, `GET /api/listings/:id`, `PATCH /api/listings/:id`, `DELETE /api/listings/:id`. Only the owning landlord may edit or delete their listings.

**Acceptance Criteria**

- [ ] `POST` returns `201` with the new listing id.
- [ ] `PATCH` and `DELETE` return `403` if the requester is not the owner.
- [ ] Incomplete listings (missing required fields) return `400`.
- [ ] Deleted listings return `404` on subsequent `GET` requests.

**Technical Notes**

- Required fields: `title`, `description`, `location`, `price`, `property_type`.
- Use transactions for create + amenity linking.

---

### BE-05 – Implement photo upload endpoint

| Field | Details |
|---|---|
| **Issue ID** | BE-05 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-05 |
| **Labels** | `backend` `listings` `media` `US-05` |

**Description**

Implement `POST /api/listings/:id/photos` to accept multiple image files, upload them to Cloudinary, and store the resulting URLs and `public_id`s in the `listing_photos` table.

**Acceptance Criteria**

- [ ] Accepts up to 10 photos per listing.
- [ ] Rejects files that exceed the allowed MIME types (JPEG, PNG, WEBP).
- [ ] Returns `403` if the requester does not own the listing.
- [ ] Returns the list of uploaded photo URLs in the response.

**Technical Notes**

- Use `multer` + `multer-storage-cloudinary`.
- Store `public_id` for future deletion via Cloudinary API.

---

### BE-06 – Implement property status update endpoint

| Field | Details |
|---|---|
| **Issue ID** | BE-06 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-06 |
| **Labels** | `backend` `listings` `US-06` |

**Description**

Implement `PATCH /api/listings/:id/status` to allow the landlord to update the status of their property. Only the values `available`, `rented`, and `under_negotiation` are accepted.

**Acceptance Criteria**

- [ ] Returns `400` if the submitted status is not in the approved list.
- [ ] Returns `403` if the requester is not the listing owner.
- [ ] Returns `200` with the updated listing on success.

**Technical Notes**

- Use an `ENUM` column `status` on the `listings` table.
- Log status transitions for audit purposes.

---

### BE-07 – Implement listing search and filter endpoint

| Field | Details |
|---|---|
| **Issue ID** | BE-07 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-07 |
| **Labels** | `backend` `search` `US-07` |

**Description**

Implement `GET /api/listings` with support for query parameters: `location`, `minPrice`, `maxPrice`, `property_type`, `amenities` (array), `status`, `sortBy`, and `page`/`limit` for pagination.

**Acceptance Criteria**

- [ ] All filters are optional and combinable.
- [ ] Returns an empty array (not an error) when no results match.
- [ ] Pagination metadata (`total`, `page`, `limit`) is included in the response.
- [ ] Results are sorted by the requested criterion or by `created_at DESC` by default.

**Technical Notes**

- Build `WHERE` clause dynamically based on provided query params.
- Sanitise all query inputs to prevent SQL injection.
- Index: `location`, `price`, `property_type`, `status` columns.

---

### BE-08 – Implement public listing preview endpoint

| Field | Details |
|---|---|
| **Issue ID** | BE-08 |
| **Role** | Backend |
| **Priority** | 🟡 Medium |
| **Related US** | US-08 |
| **Labels** | `backend` `listings` `guest` `US-08` |

**Description**

Implement `GET /api/listings/preview` — a public (no auth required) endpoint that returns a limited set of recent listings with preview-only fields: `id`, `title`, `price`, `location`, `property_type`, and one cover photo.

**Acceptance Criteria**

- [ ] No authentication is required.
- [ ] Returns at most 12 recent listings.
- [ ] Only preview fields are included (no landlord contact info).

**Technical Notes**

- Cache this response at the API or CDN level (TTL: 5 minutes).
- Exclude draft or deleted listings.

---

### BE-09 – Implement contact/messaging endpoint

| Field | Details |
|---|---|
| **Issue ID** | BE-09 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-10 |
| **Labels** | `backend` `messaging` `US-10` |

**Description**

Implement `POST /api/listings/:id/contact` so a student can initiate contact with the landlord from a listing. The endpoint should create a conversation or send a notification to the landlord.

**Acceptance Criteria**

- [ ] Only authenticated students can initiate contact.
- [ ] Returns `404` if the listing does not exist or is not visible.
- [ ] The landlord receives a notification linked to the correct listing.

**Technical Notes**

- Create a `conversations` table linking `student_id`, `landlord_id`, and `listing_id`.
- Optionally trigger an email notification to the landlord.

---

### BE-10 – Implement rental record creation endpoint

| Field | Details |
|---|---|
| **Issue ID** | BE-10 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-12 |
| **Labels** | `backend` `rentals` `US-12` |

**Description**

Implement `POST /api/rentals` to create a rental record when a property is marked as rented. The record must include `student_id`, `listing_id`, `landlord_id`, `start_date`, and `end_date`.

**Acceptance Criteria**

- [ ] Only a landlord or administrator can create a rental record.
- [ ] The listing status is automatically updated to `rented` upon record creation.
- [ ] Returns `400` if required fields are missing.
- [ ] The record is accessible to the student, landlord, and administrator.

**Technical Notes**

- Use a DB transaction: insert rental record + update listing status atomically.
- Table: `rentals (id, student_id, listing_id, landlord_id, start_date, end_date, created_at)`.

---

### BE-11 – Implement review and rating endpoints

| Field | Details |
|---|---|
| **Issue ID** | BE-11 |
| **Role** | Backend |
| **Priority** | 🟡 Medium |
| **Related US** | US-13 |
| **Labels** | `backend` `reviews` `US-13` |

**Description**

Implement `POST /api/listings/:id/reviews` to allow a student with a confirmed rental to submit a review and rating. Implement `POST /api/reviews/:reviewId/reply` for landlords to reply once.

**Acceptance Criteria**

- [ ] Returns `403` if the student has no confirmed rental for the listing.
- [ ] Rating field is required (1–5).
- [ ] A landlord can reply only once per review.
- [ ] Reviews appear on the listing detail endpoint response.

**Technical Notes**

- Table: `reviews (id, listing_id, student_id, rating, comment, created_at)`.
- Table: `review_replies (id, review_id, landlord_id, reply, created_at)`.

---

### BE-12 – Implement report submission endpoint

| Field | Details |
|---|---|
| **Issue ID** | BE-12 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-14 |
| **Labels** | `backend` `moderation` `US-14` |

**Description**

Implement `POST /api/reports` to allow authenticated students to report a listing or user account. The report is stored and queued for administrator review. A confirmation is returned to the reporter.

**Acceptance Criteria**

- [ ] Authenticated students only.
- [ ] Returns `201` with a confirmation message.
- [ ] The report is visible in the admin moderation queue.
- [ ] The reporter's identity is not exposed in the admin view.

**Technical Notes**

- Table: `reports (id, reporter_id, target_type ENUM('listing','user'), target_id, reason, status, created_at)`.

---

### BE-13 – Implement admin user management endpoints

| Field | Details |
|---|---|
| **Issue ID** | BE-13 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-16 |
| **Labels** | `backend` `admin` `US-16` |

**Description**

Implement admin-only endpoints: `GET /api/admin/users` (list all users), `PATCH /api/admin/users/:id/suspend`, `DELETE /api/admin/users/:id`. Suspended users must not be able to log in.

**Acceptance Criteria**

- [ ] All endpoints require the Administrator role.
- [ ] Suspending a user immediately invalidates their active tokens.
- [ ] A deleted user's listings are also removed or anonymised.
- [ ] Returns `403` for non-admin callers.

**Technical Notes**

- Add a `status ENUM('active', 'suspended')` column to `users`.
- Check user status in the JWT middleware.

---

### BE-14 – Implement admin listing moderation endpoints

| Field | Details |
|---|---|
| **Issue ID** | BE-14 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-17 |
| **Labels** | `backend` `admin` `moderation` `US-17` |

**Description**

Implement `GET /api/admin/listings` (with a flagged filter), `PATCH /api/admin/listings/:id/verify`, and `DELETE /api/admin/listings/:id` for administrator moderation.

**Acceptance Criteria**

- [ ] Only administrators can call these endpoints.
- [ ] Verified listings are marked and flagged listings are easily filterable.
- [ ] Deleted listings return `404` on the public API.

**Technical Notes**

- Add `verified` (boolean) and `flagged` (boolean) columns to `listings`.
- Soft-delete pattern: set `deleted_at` instead of removing the row.

---

### BE-15 – Implement admin platform metrics endpoint

| Field | Details |
|---|---|
| **Issue ID** | BE-15 |
| **Role** | Backend |
| **Priority** | 🟢 Low |
| **Related US** | US-19 |
| **Labels** | `backend` `admin` `reporting` `US-19` |

**Description**

Implement `GET /api/admin/metrics` to return platform statistics: total users, total listings, active rentals, total reports, and flagged content counts. The response should also be exportable as a CSV.

**Acceptance Criteria**

- [ ] Admin-only endpoint.
- [ ] All key metrics are returned in a single response.
- [ ] Adding `?format=csv` to the URL returns a downloadable CSV file.

**Technical Notes**

- Use `COUNT` queries per table; cache the result for 10 minutes.
- Use the `json2csv` or `fast-csv` library for CSV generation.

---

## DevOps Issues

> Issues assigned to the DevOps team, covering infrastructure, CI/CD, and deployment.

---

### DO-01 – Set up CI/CD pipeline with GitHub Actions

| Field | Details |
|---|---|
| **Issue ID** | DO-01 |
| **Role** | DevOps |
| **Priority** | 🔴 High |
| **Related US** | US-01 to US-19 |
| **Labels** | `devops` `ci-cd` `infrastructure` |

**Description**

Configure a GitHub Actions workflow that runs on every pull request and on merges to `main`. The pipeline must: install dependencies, run linting, run unit and integration tests, build the Next.js app, and deploy to the staging environment on success.

**Acceptance Criteria**

- [ ] PRs are blocked from merging if any pipeline step fails.
- [ ] The build and test stage completes in under 5 minutes.
- [ ] Successful merges to `main` trigger an automatic staging deployment.
- [ ] Environment secrets (DB, JWT, Cloudinary) are injected via GitHub Secrets.

**Technical Notes**

- Use `actions/checkout`, `actions/setup-node`, and a deploy action for the hosting provider.
- Cache `node_modules` between runs to speed up builds.
- Add a separate workflow for production deploys (manual trigger or tag-based).

---

### DO-02 – Provision and configure MySQL database with migrations

| Field | Details |
|---|---|
| **Issue ID** | DO-02 |
| **Role** | DevOps |
| **Priority** | 🔴 High |
| **Related US** | US-01 to US-19 |
| **Labels** | `devops` `database` `infrastructure` |

**Description**

Provision the MySQL database instance for development, staging, and production environments. Set up a migration tool (e.g., db-migrate or Flyway) to version-control schema changes. Automate migration runs as part of the CI/CD pipeline.

**Acceptance Criteria**

- [ ] Schema migrations run automatically on deploy.
- [ ] Rolling back a migration is possible without data loss.
- [ ] Separate databases are used for development, staging, and production.
- [ ] Database credentials are stored in environment variables, never hardcoded.

**Technical Notes**

- Use `db-migrate` or Knex migrations.
- Enable automated backups on the production DB (daily, 30-day retention).
- Restrict production DB access to the application server IP only.

---

### DO-03 – Configure Cloudinary and media CDN

| Field | Details |
|---|---|
| **Issue ID** | DO-03 |
| **Role** | DevOps |
| **Priority** | 🟡 Medium |
| **Related US** | US-05 |
| **Labels** | `devops` `media` `infrastructure` `US-05` |

**Description**

Set up the Cloudinary account and configure upload presets for the listing photo upload flow. Ensure API keys are available as environment variables in all environments. Configure a CDN layer for serving uploaded images efficiently.

**Acceptance Criteria**

- [ ] Photos are served via CDN with correct cache headers.
- [ ] Upload presets restrict file types to JPEG, PNG, and WEBP.
- [ ] Cloudinary credentials are environment-specific and not committed to the repository.

**Technical Notes**

- Use Cloudinary's unsigned upload preset for client-side uploads or signed uploads via the backend.
- Enable Cloudinary's automatic format optimisation (`f_auto`, `q_auto`).

---

### DO-04 – Set up environment configuration and secrets management

| Field | Details |
|---|---|
| **Issue ID** | DO-04 |
| **Role** | DevOps |
| **Priority** | 🟡 Medium |
| **Related US** | US-01 to US-19 |
| **Labels** | `devops` `security` `infrastructure` |

**Description**

Define and document all required environment variables for the frontend and backend. Ensure `.env.example` files are maintained for both projects. Configure GitHub Secrets for CI/CD and the deployment environment's secret manager for runtime.

**Acceptance Criteria**

- [ ] No secrets are committed to the repository.
- [ ] `.env.example` is up to date and documents every variable.
- [ ] All environments (dev, staging, prod) have isolated secret sets.
- [ ] Rotating a secret requires no code changes.

**Technical Notes**

- Variables to manage: `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `NEXT_PUBLIC_API_URL`, `EMAIL_*`.
- Consider using a secrets manager (AWS Secrets Manager, Doppler, etc.) for production.

---

### DO-05 – Set up application monitoring and logging

| Field | Details |
|---|---|
| **Issue ID** | DO-05 |
| **Role** | DevOps |
| **Priority** | 🟢 Low |
| **Related US** | US-19 |
| **Labels** | `devops` `monitoring` `observability` |

**Description**

Integrate an application monitoring solution (e.g., Sentry for error tracking, Datadog or Logtail for logs). Configure alerts for error rate spikes, high response times, and deployment failures.

**Acceptance Criteria**

- [ ] Unhandled backend errors are captured and visible in the monitoring dashboard.
- [ ] Frontend JS errors are captured via Sentry.
- [ ] Alerts are sent to the team Slack channel on critical errors.
- [ ] Logs are retained for at least 30 days.

**Technical Notes**

- Use Sentry SDK for both Next.js and Node.js.
- Redact personally identifiable information (email, name) from logs.

---

## QA Issues

> Issues assigned to the QA team, covering test design, execution, and quality assurance.

---

### QA-01 – Write and execute authentication test suite

| Field | Details |
|---|---|
| **Issue ID** | QA-01 |
| **Role** | QA |
| **Priority** | 🔴 High |
| **Related US** | US-01, US-02 |
| **Labels** | `qa` `auth` `testing` `US-01` `US-02` |

**Description**

Design and execute a comprehensive test suite covering all authentication flows: registration, login, logout, and session persistence. Include both happy-path and negative/edge cases.

**Acceptance Criteria**

- [ ] All TC-01 through TC-05 test cases pass.
- [ ] Edge cases tested: empty fields, SQL injection in inputs, expired tokens.
- [ ] Test results are documented in the test management tool.

**Technical Notes**

- Use Playwright for E2E browser tests.
- Use Jest + Supertest for API-level tests.
- Tag tests with the related user story ID.

---

### QA-02 – Write and execute listing management test suite

| Field | Details |
|---|---|
| **Issue ID** | QA-02 |
| **Role** | QA |
| **Priority** | 🔴 High |
| **Related US** | US-04, US-05, US-06 |
| **Labels** | `qa` `listings` `testing` `US-04` `US-05` `US-06` |

**Description**

Design and execute test cases covering the full listing lifecycle: creation, editing, photo upload, status changes, and deletion. Verify that incomplete listings are blocked and that status values are restricted.

**Acceptance Criteria**

- [ ] TC-08 through TC-15 all pass.
- [ ] Photo upload limits are enforced at both UI and API levels.
- [ ] Unauthorised edits (wrong landlord) are rejected with a `403`.

**Technical Notes**

- Include file upload edge cases: wrong MIME type, oversized file.
- Test with both Playwright (UI) and Supertest (API).

---

### QA-03 – Write and execute search, filter and listing view test suite

| Field | Details |
|---|---|
| **Issue ID** | QA-03 |
| **Role** | QA |
| **Priority** | 🔴 High |
| **Related US** | US-07, US-08, US-09 |
| **Labels** | `qa` `search` `testing` `US-07` `US-08` `US-09` |

**Description**

Test the search and filter functionality with various filter combinations, including combinations that yield no results. Test the guest preview page and the full property detail page.

**Acceptance Criteria**

- [ ] TC-16, TC-17, TC-18, TC-19 all pass.
- [ ] All filter combinations return consistent and correct results.
- [ ] Guest users cannot access contact or save features.

**Technical Notes**

- Parameterise filter tests to cover multiple combinations efficiently.
- Verify that the "No results" message appears correctly.

---

### QA-04 – Write and execute reviews and reporting test suite

| Field | Details |
|---|---|
| **Issue ID** | QA-04 |
| **Role** | QA |
| **Priority** | 🟡 Medium |
| **Related US** | US-13, US-14 |
| **Labels** | `qa` `reviews` `moderation` `testing` `US-13` `US-14` |

**Description**

Test the review submission flow, including the restriction that only students with a confirmed rental may submit. Test the report submission flow and confirm that reports appear in the admin queue.

**Acceptance Criteria**

- [ ] TC-23, TC-24, TC-25 all pass.
- [ ] A student without a rental cannot access the review form.
- [ ] Reports are received and visible to the administrator.

**Technical Notes**

- Seed test data: one student with a confirmed rental, one without.
- Verify that the landlord reply is limited to one per review.

---

### QA-05 – Write and execute admin panel test suite

| Field | Details |
|---|---|
| **Issue ID** | QA-05 |
| **Role** | QA |
| **Priority** | 🔴 High |
| **Related US** | US-16, US-17, US-18, US-19 |
| **Labels** | `qa` `admin` `testing` `US-16` `US-17` `US-18` `US-19` |

**Description**

Test all administrator functions: user suspension/deletion, listing verification and removal, review moderation, and the platform metrics dashboard including CSV export.

**Acceptance Criteria**

- [ ] TC-27 through TC-30 all pass.
- [ ] Suspended users cannot log in.
- [ ] Removed listings are not visible on the public API.
- [ ] CSV export contains accurate data.

**Technical Notes**

- Test role boundaries: regular users must not access admin endpoints (expect `403`).
- Verify metrics accuracy by comparing with direct DB counts.

---

### QA-06 – Perform cross-browser and mobile responsiveness testing

| Field | Details |
|---|---|
| **Issue ID** | QA-06 |
| **Role** | QA |
| **Priority** | 🟡 Medium |
| **Related US** | US-01 to US-19 |
| **Labels** | `qa` `compatibility` `testing` |

**Description**

Verify that all key user flows work correctly across major browsers (Chrome, Firefox, Safari, Edge) and on mobile viewports (360px, 414px, 768px).

**Acceptance Criteria**

- [ ] All flows work on Chrome, Firefox, Safari, and Edge.
- [ ] No layout breakages on 360px, 414px, and 768px viewports.
- [ ] No console errors appear on any browser.

**Technical Notes**

- Use Playwright's multi-browser support.
- Focus on: registration, login, listing creation, search, and property detail page.

---

### QA-07 – Perform basic security and penetration testing

| Field | Details |
|---|---|
| **Issue ID** | QA-07 |
| **Role** | QA |
| **Priority** | 🟢 Low |
| **Related US** | US-01 to US-19 |
| **Labels** | `qa` `security` `testing` |

**Description**

Conduct basic security checks on the API: SQL injection, XSS, CSRF, broken authentication, and sensitive data exposure. Document findings and open separate issues for any vulnerabilities discovered.

**Acceptance Criteria**

- [ ] SQL injection attempts on all query parameters return `400` or are sanitised.
- [ ] XSS payloads in listing fields are escaped and not executed.
- [ ] Accessing admin endpoints without an admin token returns `403`.
- [ ] Passwords and tokens are never returned in API responses.

**Technical Notes**

- Use OWASP ZAP for automated scanning.
- Manually test authentication edge cases: token replay, role elevation.

---

*Total: 34 issues — 12 Frontend · 15 Backend · 5 DevOps · 7 QA*