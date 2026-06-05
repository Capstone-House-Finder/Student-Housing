# Admin Listing Moderation Documentation

## Database Schema Changes

The **listings** table has been extended to support admin moderation:

- `verified` **BOOLEAN** – defaults to `false`. Indicates whether an admin has verified the listing.
- `flagged` **BOOLEAN** – defaults to `false`. When set to `true`, the listing is considered blocked and will not be returned by public endpoints.
- `deleted_at` **TIMESTAMP** – already present for soft‑deletion. A non‑null value indicates the listing is removed and should not be accessible.

These columns enable the following admin API endpoints (see below).

## Admin API Endpoints (BE‑14)

| Method | URL | Description | Permissions |
|--------|-----|-------------|-------------|
| `GET` | `/api/admin/listings` | Returns all **flagged** listings that are not soft‑deleted. | Admin only |
| `PATCH` | `/api/admin/listings/:id/verify` | Marks a listing as verified (`verified = true`) and clears the flagged status (`flagged = false`). | Admin only |
| `DELETE` | `/api/admin/listings/:id` | Soft‑deletes a listing by setting `deleted_at` to the current timestamp. | Admin only |

All admin routes are protected by the `authenticate` middleware and the `admin` role check.

## Behaviour Notes

- Public endpoints (e.g., `GET /api/listings/:id`) now include `AND flagged = false` in their SQL queries to ensure blocked listings are not accessible.
- Soft‑deleted listings (`deleted_at` not null) are always excluded from any public or admin fetches unless the admin explicitly deletes them via the admin endpoint.
- The `verifyListing` endpoint also clears the `flagged` flag, making the listing visible to normal users.

---

*Generated with Claude Code*