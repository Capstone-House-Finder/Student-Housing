# New Features — GitHub Issues

> Features: Dark Mode · Multi-language · Messaging · Recommendations · Payments · Map
> Roles covered: **Frontend** | **Backend** | **DevOps** | **QA**

---

## Table of Contents

- [Frontend Issues](#frontend-issues)
- [Backend Issues](#backend-issues)
- [DevOps Issues](#devops-issues)
- [QA Issues](#qa-issues)

---

## Frontend Issues

---

### FE-13 – Implement dark mode toggle

| Field | Details |
|---|---|
| **Issue ID** | FE-13 |
| **Role** | Frontend |
| **Priority** | 🟡 Medium |
| **Related US** | US-20 |
| **Labels** | `frontend` `UI` `US-20` |

**Description**

Add a dark/light mode toggle to the navigation bar. The selected theme must persist across sessions and respect the device system preference on first load. All components, pages, and modals must render correctly in both themes.

**Acceptance Criteria**

- [ ] Toggle is visible in the navbar on all pages.
- [ ] Theme persists after page refresh (stored in localStorage or a cookie).
- [ ] System preference (`prefers-color-scheme`) is used on first visit.
- [ ] No components have visible contrast or layout issues in dark mode.

**Technical Notes**

- Use Next.js + Tailwind dark mode class strategy or CSS variables.
- Use `next-themes` library for SSR-safe theme management.
- Test all existing pages and modals in dark mode before closing.

---

### FE-14 – Implement multi-language support (i18n)

| Field | Details |
|---|---|
| **Issue ID** | FE-14 |
| **Role** | Frontend |
| **Priority** | 🟡 Medium |
| **Related US** | US-21 |
| **Labels** | `frontend` `i18n` `US-21` |

**Description**

Add internationalisation support to the Next.js frontend. A language selector must be accessible from the navigation bar or settings page. All visible text must update immediately when the user changes language. The selected language must persist across sessions.

**Acceptance Criteria**

- [ ] Language selector is visible and functional on all pages.
- [ ] All UI strings are externalised into translation files — no hardcoded text.
- [ ] Selected language is saved and restored on next visit.
- [ ] At least two languages are supported at launch (e.g. English and French).

**Technical Notes**

- Use `next-i18next` or `next-intl` for Next.js i18n.
- Store translation files in `/public/locales/<lang>/common.json`.
- Configure `next.config.ts` with the i18n locale settings.

---

### FE-15 – Build in-app messaging UI

| Field | Details |
|---|---|
| **Issue ID** | FE-15 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-22 |
| **Labels** | `frontend` `messaging` `US-22` |

**Description**

Implement the real-time messaging interface for student-landlord communication. A conversation is initiated from the property listing detail page. The chat UI must display the full conversation history, show unread message badges, and update in real time without requiring a page refresh.

**Acceptance Criteria**

- [ ] Message thread opens from the listing detail page.
- [ ] Messages appear in real time without a page reload.
- [ ] Unread message count badge is shown in the navigation bar.
- [ ] Full conversation history loads on opening a thread.
- [ ] The UI is responsive on mobile and desktop.

**Technical Notes**

- Connect to the WebSocket endpoint exposed by the backend (BE-16).
- Use the `useWebSocket` hook or `socket.io-client`.
- Route: `/messages` or a slide-over panel accessible from any page.

---

### FE-16 – Build property recommendation section

| Field | Details |
|---|---|
| **Issue ID** | FE-16 |
| **Role** | Frontend |
| **Priority** | 🟢 Low |
| **Related US** | US-23 |
| **Labels** | `frontend` `recommendations` `US-23` |

**Description**

Add a recommendations section to the student dashboard and home page. Recommendations are fetched from the backend and displayed as listing cards. The student can dismiss individual recommendations.

**Acceptance Criteria**

- [ ] Recommendations section is visible on the student dashboard.
- [ ] Each recommendation renders as a listing preview card.
- [ ] Dismissing a card removes it from the list and persists the dismissal.
- [ ] Section is hidden if no recommendations are available.

**Technical Notes**

- `GET /api/recommendations` (see BE-17).
- `DELETE /api/recommendations/:listingId/dismiss`.
- Handle empty state with a friendly message.

---

### FE-17 – Build online payment UI

| Field | Details |
|---|---|
| **Issue ID** | FE-17 |
| **Role** | Frontend |
| **Priority** | 🔴 High |
| **Related US** | US-24 |
| **Labels** | `frontend` `payments` `US-24` |

**Description**

Implement the payment flow on the student rental record page. The student initiates a payment, is guided through checkout, and receives an on-screen confirmation and an email receipt after a successful transaction. Failed payments must show a clear error message with next steps.

**Acceptance Criteria**

- [ ] Pay button is visible on the student rental record page.
- [ ] Payment form is rendered via the payment provider's secure SDK.
- [ ] Success screen is shown immediately after a confirmed payment.
- [ ] Failed payments display a descriptive error message.
- [ ] No card data touches the application server.

**Technical Notes**

- Integrate Stripe.js or a similar PCI-compliant SDK.
- Use Stripe Elements or Payment Element for the card form.
- `POST /api/payments/initiate` to create a PaymentIntent.
- Confirm client-side using `stripe.confirmPayment()`.

---

### FE-18 – Build interactive map view for listings

| Field | Details |
|---|---|
| **Issue ID** | FE-18 |
| **Role** | Frontend |
| **Priority** | 🟡 Medium |
| **Related US** | US-25 |
| **Labels** | `frontend` `map` `US-25` |

**Description**

Add a map view tab to the search results page. Each listing is shown as a pin on the map. Clicking a pin opens a preview card. The map updates its pins when the user changes search filters. The student can optionally set their university as a reference point.

**Acceptance Criteria**

- [ ] Map tab is available alongside the list view on the search page.
- [ ] Each visible listing renders as a clickable pin.
- [ ] Clicking a pin shows a preview card with title, price, and a link to the detail page.
- [ ] Applying filters updates the pins without a full page reload.
- [ ] University/reference point can be set and is highlighted on the map.

**Technical Notes**

- Use Mapbox GL JS or Google Maps JavaScript API.
- Store the API key in `NEXT_PUBLIC_MAP_API_KEY`.
- Cluster pins when many listings are in the same area.

---

## Backend Issues

---

### BE-16 – Implement real-time messaging backend with WebSockets

| Field | Details |
|---|---|
| **Issue ID** | BE-16 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-22 |
| **Labels** | `backend` `messaging` `websockets` `US-22` |

**Description**

Implement the real-time messaging system using WebSockets (socket.io). Messages are persisted in the database and delivered in real time to connected clients. The system must also support push notifications for offline users.

**Acceptance Criteria**

- [ ] Authenticated users can connect to the WebSocket server.
- [ ] Messages are persisted to the `messages` table before being emitted.
- [ ] Unread message counts are tracked per conversation per user.
- [ ] `GET /api/conversations` and `GET /api/conversations/:id/messages` work correctly.
- [ ] `POST /api/conversations/:id/messages` creates and emits a message.

**Technical Notes**

- Use `socket.io` with the existing Express server.
- Authenticate socket connections using the JWT middleware.
- Table: `messages (id, conversation_id, sender_id, body, read_at, created_at)`.
- Emit to a room named `conversation:<id>` so only participants receive messages.

---

### BE-17 – Implement property recommendation engine

| Field | Details |
|---|---|
| **Issue ID** | BE-17 |
| **Role** | Backend |
| **Priority** | 🟢 Low |
| **Related US** | US-23 |
| **Labels** | `backend` `recommendations` `US-23` |

**Description**

Implement `GET /api/recommendations` to return personalised listing suggestions for the authenticated student based on their search history, saved filters, and viewed listings. Implement `DELETE /api/recommendations/:listingId/dismiss` to exclude a listing.

**Acceptance Criteria**

- [ ] Returns at most 10 recommendations per request.
- [ ] Recommendations exclude listings the student has already viewed or dismissed.
- [ ] Dismissed listings are excluded from future recommendation results.
- [ ] Returns an empty array (not an error) when no recommendations are available.

**Technical Notes**

- Start with a simple content-based filter: match on `location`, `price range`, and `property_type` from the student's last 10 searches.
- Table: `recommendation_dismissals (student_id, listing_id, dismissed_at)`.
- Cache recommendations per student for 30 minutes.

---

### BE-18 – Implement online payment processing endpoints

| Field | Details |
|---|---|
| **Issue ID** | BE-18 |
| **Role** | Backend |
| **Priority** | 🔴 High |
| **Related US** | US-24 |
| **Labels** | `backend` `payments` `US-24` |

**Description**

Integrate Stripe (or equivalent) to handle rent payments. `POST /api/payments/initiate` creates a PaymentIntent and returns the client secret. `POST /api/payments/webhook` handles Stripe webhook events to confirm payment and create a payment record.

**Acceptance Criteria**

- [ ] `POST /api/payments/initiate` returns a Stripe client secret.
- [ ] Webhook handler verifies the Stripe signature before processing.
- [ ] A payment record is created only after a confirmed webhook event.
- [ ] Payment confirmation email is sent to the student on success.
- [ ] Returns `400` for invalid payment amounts.

**Technical Notes**

- Use the `stripe` Node.js SDK.
- NEVER log or store card data — Stripe handles all PCI-sensitive data.
- Table: `payments (id, rental_id, student_id, amount, currency, stripe_payment_id, status, created_at)`.
- Store `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in environment variables.

---

### BE-19 – Expose geo-coordinates on listing endpoints

| Field | Details |
|---|---|
| **Issue ID** | BE-19 |
| **Role** | Backend |
| **Priority** | 🟡 Medium |
| **Related US** | US-25 |
| **Labels** | `backend` `map` `US-25` |

**Description**

Update the listing creation and retrieval endpoints to support geographic coordinates. Coordinates are used by the frontend map to place listing pins accurately. Geocoding should be performed server-side when a listing is created or updated.

**Acceptance Criteria**

- [ ] Listing creation accepts an optional `latitude` and `longitude`.
- [ ] If coordinates are not provided, geocode the location string server-side.
- [ ] `GET /api/listings` returns `latitude` and `longitude` fields for each result.
- [ ] `GET /api/listings?bounds=sw_lat,sw_lng,ne_lat,ne_lng` filters by map viewport.

**Technical Notes**

- Use the Google Geocoding API or OpenCage for geocoding.
- Add `latitude DECIMAL(9,6)` and `longitude DECIMAL(9,6)` columns to `listings`.
- Add a spatial index on `(latitude, longitude)` for bounds queries.

---

## DevOps Issues

---

### DO-06 – Configure WebSocket support on the staging and production servers

| Field | Details |
|---|---|
| **Issue ID** | DO-06 |
| **Role** | DevOps |
| **Priority** | 🔴 High |
| **Related US** | US-22 |
| **Labels** | `devops` `websockets` `infrastructure` `US-22` |

**Description**

Update the server and reverse proxy configuration to support persistent WebSocket connections alongside standard HTTP traffic. Ensure the CI/CD pipeline does not terminate WebSocket connections during rolling deploys.

**Acceptance Criteria**

- [ ] WebSocket connections (`wss://`) are accepted on the same port as the API.
- [ ] Nginx (or equivalent) is configured with `proxy_read_timeout` and upgrade headers.
- [ ] Existing HTTP API requests are not affected by the WebSocket configuration.
- [ ] pm2 is configured to gracefully reload without dropping open connections.

**Technical Notes**

- Add `proxy_http_version 1.1`, `Upgrade`, and `Connection` headers to the Nginx config.
- Use pm2's graceful reload (not restart) to minimise connection drops.
- Test with at least two simultaneous WebSocket clients before closing.

---

### DO-07 – Configure Stripe webhook endpoint and environment secrets

| Field | Details |
|---|---|
| **Issue ID** | DO-07 |
| **Role** | DevOps |
| **Priority** | 🔴 High |
| **Related US** | US-24 |
| **Labels** | `devops` `payments` `security` `US-24` |

**Description**

Add Stripe API keys and webhook secret to all environment configurations. Ensure the Stripe webhook endpoint is publicly reachable on the staging and production servers and is protected by signature verification.

**Acceptance Criteria**

- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are stored as GitHub Environment secrets.
- [ ] The webhook endpoint is reachable at `POST /api/payments/webhook` from Stripe's servers.
- [ ] Stripe's IP ranges are not blocked by any firewall rules.
- [ ] `.env.example` is updated with the new variable names.

**Technical Notes**

- Register the webhook URL in the Stripe dashboard for both staging and production.
- Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to the GitHub staging and production environments.
- Use the Stripe CLI locally for webhook testing: `stripe listen --forward-to localhost:5000/api/payments/webhook`.

---

### DO-08 – Configure map API key as environment variable

| Field | Details |
|---|---|
| **Issue ID** | DO-08 |
| **Role** | DevOps |
| **Priority** | 🟡 Medium |
| **Related US** | US-25 |
| **Labels** | `devops` `map` `infrastructure` `US-25` |

**Description**

Add the map provider API key (Mapbox or Google Maps) to all environment configurations. The key must be scoped to restrict usage to the application's domain only, preventing unauthorised use.

**Acceptance Criteria**

- [ ] `NEXT_PUBLIC_MAP_API_KEY` is added to GitHub Environment secrets for staging and production.
- [ ] The key is domain-restricted in the map provider's dashboard.
- [ ] `.env.example` is updated with the new variable name and a description.
- [ ] A separate key is used for each environment (development, staging, production).

**Technical Notes**

- For Mapbox: restrict by URL in the Mapbox token settings.
- For Google Maps: restrict by HTTP referrer in the Google Cloud Console.
- Add the variable to the frontend build step in `frontend-ci.yml`.

---

## QA Issues

---

### QA-08 – Test dark mode across all pages and components

| Field | Details |
|---|---|
| **Issue ID** | QA-08 |
| **Role** | QA |
| **Priority** | 🟡 Medium |
| **Related US** | US-20 |
| **Labels** | `qa` `dark-mode` `testing` `US-20` |

**Description**

Verify that the dark mode toggle works correctly, persists the selection, and that every page and component renders without contrast issues or layout breaks in dark mode.

**Acceptance Criteria**

- [ ] Toggle switches theme correctly on all pages.
- [ ] Theme persists after page refresh and on next session.
- [ ] System preference is applied on first visit.
- [ ] No text-on-background contrast failures (WCAG AA minimum).
- [ ] No layout or overflow issues in dark mode.

**Technical Notes**

- Use Playwright to automate theme toggle tests across all main pages.
- Use `axe-core` or Lighthouse to check contrast ratios in dark mode.
- Manually review modals, dropdowns, and form fields.

---

### QA-09 – Test real-time messaging flow end-to-end

| Field | Details |
|---|---|
| **Issue ID** | QA-09 |
| **Role** | QA |
| **Priority** | 🔴 High |
| **Related US** | US-22 |
| **Labels** | `qa` `messaging` `testing` `US-22` |

**Description**

Test the full messaging flow between a student and a landlord, including message delivery in real time, conversation history, unread badges, and notifications. Test edge cases such as sending messages while offline.

**Acceptance Criteria**

- [ ] Messages are delivered in real time to both participants.
- [ ] Conversation history loads correctly on opening a thread.
- [ ] Unread badge count updates immediately when a message is received.
- [ ] Reconnection after a dropped connection does not lose messages.
- [ ] Unauthenticated WebSocket connection attempts are rejected.

**Technical Notes**

- Use two separate browser sessions (student and landlord) in Playwright.
- Simulate a dropped connection using Playwright's network interception.
- Test with both desktop and mobile viewports.

---

### QA-10 – Test online payment flow

| Field | Details |
|---|---|
| **Issue ID** | QA-10 |
| **Role** | QA |
| **Priority** | 🔴 High |
| **Related US** | US-24 |
| **Labels** | `qa` `payments` `testing` `US-24` |

**Description**

Test the full payment flow using Stripe's test card numbers. Cover successful payments, declined cards, network errors, and webhook delivery. Verify that payment records are created correctly and confirmation emails are sent.

**Acceptance Criteria**

- [ ] Successful payment shows confirmation screen and creates a payment record.
- [ ] Declined card shows a clear error message without crashing.
- [ ] Webhook events are processed correctly and idempotently.
- [ ] Confirmation email is received by the student after a successful payment.
- [ ] No card data appears in application logs.

**Technical Notes**

- Use Stripe test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 9995` (decline).
- Use the Stripe CLI to replay webhook events in the test environment.
- Verify the `payments` table is updated correctly after each test case.

---

### QA-11 – Test map view and listing pin interactions

| Field | Details |
|---|---|
| **Issue ID** | QA-11 |
| **Role** | QA |
| **Priority** | 🟡 Medium |
| **Related US** | US-25 |
| **Labels** | `qa` `map` `testing` `US-25` |

**Description**

Test the interactive map view on the search results page. Verify that pins are placed correctly, preview cards open on click, and that the map updates correctly when filters are changed.

**Acceptance Criteria**

- [ ] All listings in the current search results appear as pins on the map.
- [ ] Clicking a pin opens the correct listing preview card.
- [ ] Applying a filter updates the pins without a full page reload.
- [ ] Map loads correctly on mobile viewports.
- [ ] No pins are shown for listings outside the current filter results.

**Technical Notes**

- Use Playwright with a mocked map tile server to avoid API costs in CI.
- Test with at least 20 listings to verify pin clustering behaviour.
- Verify pin placement accuracy against known coordinates in the test database.

---

*Total: 19 issues — 6 Frontend · 4 Backend · 3 DevOps · 4 QA*
