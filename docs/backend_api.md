# Backend API Reference

This document provides a concise reference for the public and protected REST endpoints exposed by the **Student Housing Platform** backend (Express 5). All routes are defined under `backend/src/Routes/` and the corresponding controller logic lives in `backend/src/controllers/`.

---

## Table of Contents
1. [Authentication & Tokens](#authentication--tokens)
2. [User Profile](#user-profile)
3. [Listings](#listings)
4. [Contacts & Messaging](#contacts--messaging)
5. [Reviews & Ratings](#reviews--ratings)
6. [Reports](#reports)
7. [Push Notifications](#push-notifications)
8. [Error Handling](#error-handling)
9. [Versioning & Base URL](#versioning--base-url)

---

## Authentication & Tokens <a name="authentication--tokens"></a>
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/v1/register` | Register a new user (email, password, optional profile fields). Returns access and refresh JWTs. | ❌ |
| `POST` | `/api/v1/login` | Authenticate a user with email/password. Returns access and refresh JWTs. | ❌ |
| `POST` | `/api/v1/refresh` | Exchange a valid refresh token for a new access token. | ❌ |

**Tokens**
- **Access token** (`Authorization: Bearer <token>`) – expires in 7 days, used for all protected routes.
- **Refresh token** – expires in 30 days, stored http‑only cookie; submitted to `/refresh` to obtain a fresh access token.

---

## User Profile <a name="user-profile"></a>
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/me` | Retrieve the authenticated user’s profile and basic account info. | ✅ |
| `PUT` | `/api/v1/me` | Update profile fields (full name, phone, avatar, bio). Only the owner may modify. | ✅ |

**Request body (PUT)**
```json
{
  "full_name": "John Doe",
  "phone": "+1-555-123-4567",
  "avatar_url": "https://example.com/avatar.png",
  "bio": "Computer science student looking for housing."
}
```

---

## Listings <a name="listings"></a>
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/listings` | Search and filter listings. Supports query parameters for pagination, price range, location, and property status. | ✅ |
| `GET` | `/api/v1/listings/:id` | Retrieve a single listing by its UUID. | ✅ |
| `POST` | `/api/v1/listings` | Create a new listing (landlord only). Includes photos, description, rent details, and availability dates. | ✅ (landlord) |
| `PUT` | `/api/v1/listings/:id` | Update an existing listing. Only the owning landlord may modify. | ✅ (landlord) |
| `DELETE` | `/api/v1/listings/:id` | Delete a listing. | ✅ (landlord) |

**Typical payload for `POST /listings`**
```json
{
  "title": "Spacious 2‑bedroom near campus",
  "description": "A bright apartment with balcony.",
  "price": 1200,
  "address": "123 College Ave",
  "city": "Boston",
  "state": "MA",
  "zip": "02115",
  "photos": ["https://cloudinary.com/.../photo1.jpg"],
  "available_from": "2026-09-01"
}
```

---

## Contacts & Messaging <a name="contacts--messaging"></a>
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/v1/contacts` | Send a message to a landlord or student. Stores the conversation in the DB and optionally forwards to WhatsApp (if configured). | ✅ |
| `GET` | `/api/v1/contacts/:listingId` | Retrieve all messages related to a specific listing for the authenticated user. | ✅ |

---

## Reviews & Ratings <a name="reviews--ratings"></a>
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/v1/reviews` | Submit a rating (1‑5) and textual review for a completed stay. | ✅ (student) |
| `GET` | `/api/v1/reviews/:listingId` | Fetch all reviews for a listing, including average rating. | ✅ |

---

## Reports <a name="reports"></a>
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/v1/reports` | Submit a report about a listing (e.g., incorrect info, policy violation). Includes optional screenshot URLs. | ✅ |
| `GET` | `/api/v1/reports` | Admin endpoint – list all pending reports. | ✅ (admin) |
| `PATCH` | `/api/v1/reports/:id` | Admin action: mark report as resolved or take corrective action. | ✅ (admin) |

---

## Push Notifications <a name="push-notifications"></a>
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/v1/push/register` | Register a device token for push notifications (e.g., Expo token). | ✅ |
| `POST` | `/api/v1/push/send` | Send a targeted push notification to a user or group. Only internal services should call this endpoint. | ✅ (internal) |

---

## Error Handling <a name="error-handling"></a>
All error responses follow this JSON schema:
```json
{
  "success": false,
  "error": {
    "message": "Human‑readable description",
    "code": "OPTIONAL_ERROR_CODE",
    "details": { /* optional additional data */ }
  }
}
```
Common HTTP status codes used:
- `400` – Validation error or malformed request.
- `401` – Authentication required or invalid credentials.
- `403` – Authorized but insufficient permissions (e.g., student trying to delete a listing).
- `404` – Resource not found.
- `409` – Conflict (e.g., email already registered).
- `500` – Unexpected server error.

---

## Versioning & Base URL <a name="versioning--base-url"></a>
- **Base URL (development)**: `http://localhost:5000/api/v1`
- **Base URL (production)**: `https://api.student-housing.com/api/v1`
- The API is versioned via the `/api/v1` prefix; future major changes will bump the version number.

---

## Additional Resources
- **OpenAPI Specification** – see `docs/openapi.json` for a machine‑readable definition.
- **Postman Collection** – `docs/postman_collection.json` provides ready‑to‑import requests.
- **Authentication Middleware** – implementation details in `backend/src/middleware/auth.js`.
- **Database Schema** – `mysql/init/01_schema.sql` contains table definitions referenced by the API.

---

*Generated with Claude Code*