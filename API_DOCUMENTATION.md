# Student Housing Platform - API Documentation

**Base URL:** `http://localhost:5000`  
**Version:** 1.0.0  
**Last Updated:** April 30, 2026

---

## Table of Contents
1. [Authentication](#authentication)
2. [Listings](#listings)
3. [Photos](#photos)
4. [Health Check](#health-check)
5. [Error Handling](#error-handling)
6. [Validation Rules](#validation-rules)

---

## Authentication

All protected endpoints require an `Authorization` header with a valid JWT token:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are returned from the login endpoint and expire after 7 days.

---

## Endpoints

### Authentication Endpoints

#### Register New User
**Endpoint:** `POST /api/auth/register`  
**Auth Required:** No  
**Description:** Create a new user account with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "student"
}
```

**Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| email | string | Yes | Valid email format |
| password | string | Yes | 8+ chars, uppercase, lowercase, number, special char |
| role | enum | No | "student" \| "landlord" \| "admin" (default: "student") |

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` - Invalid input (email format, password requirements)
- `409` - Email already registered

---

#### User Login
**Endpoint:** `POST /api/auth/login`  
**Auth Required:** No  
**Description:** Authenticate with email and password, receive JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Parameters:**
| Field | Type | Required |
|-------|------|----------|
| email | string | Yes |
| password | string | Yes |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

**Error Responses:**
- `400` - Invalid email format
- `401` - Invalid credentials (user not found or password mismatch)

---

#### Get Current User Profile
**Endpoint:** `GET /api/auth/me`  
**Auth Required:** Yes (Bearer token)  
**Description:** Retrieve the authenticated user's profile information

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "student",
    "created_at": "2026-04-30T10:00:00Z"
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `403` - Token expired

---

#### Update User Profile
**Endpoint:** `PUT /api/auth/me`  
**Auth Required:** Yes (Bearer token)  
**Description:** Update the authenticated user's profile (stub - not fully implemented)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }
}
```

**Error Responses:**
- `400` - Invalid input
- `401` - Missing or invalid token
- `404` - User not found

---

### Listings Endpoints

#### Get All Listings
**Endpoint:** `GET /api/listings`  
**Auth Required:** No  
**Description:** Retrieve all active property listings with optional filtering

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Pagination page (default: 1) |
| limit | number | Items per page (default: 20) |
| type | string | Filter by property type (apartment, house, room, etc.) |
| min_price | number | Filter by minimum price |
| max_price | number | Filter by maximum price |
| location | string | Filter by location (partial match) |

**Example:** `GET /api/listings?page=1&limit=10&type=apartment&min_price=500`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": 1,
        "title": "Cozy Apartment Downtown",
        "description": "Modern apartment with great views",
        "price": 1200.00,
        "location": "City Center",
        "property_type": "apartment",
        "landlord_id": 2,
        "status": "published",
        "amenities": ["WiFi", "Parking", "Gym"],
        "photo_count": 3,
        "created_at": "2026-04-25T15:30:00Z",
        "updated_at": "2026-04-28T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

**Error Responses:**
- `400` - Invalid query parameters

---

#### Get Single Listing
**Endpoint:** `GET /api/listings/:id`  
**Auth Required:** No  
**Description:** Retrieve detailed information for a specific listing including amenities and photos

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Listing ID (required) |

**Example:** `GET /api/listings/1`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Cozy Apartment Downtown",
    "description": "Modern apartment with great views",
    "price": 1200.00,
    "location": "City Center",
    "property_type": "apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "square_feet": 850,
    "landlord_id": 2,
    "landlord_email": "landlord@example.com",
    "status": "published",
    "amenities": [
      { "id": 1, "name": "WiFi" },
      { "id": 2, "name": "Parking" },
      { "id": 5, "name": "Gym" }
    ],
    "photos": [
      {
        "id": 10,
        "url": "/uploads/listing-1-photo-1.jpg",
        "created_at": "2026-04-25T15:35:00Z"
      }
    ],
    "created_at": "2026-04-25T15:30:00Z",
    "updated_at": "2026-04-28T10:00:00Z"
  }
}
```

**Error Responses:**
- `404` - Listing not found

---

#### Create New Listing
**Endpoint:** `POST /api/listings`  
**Auth Required:** Yes (Bearer token, must be landlord)  
**Description:** Create a new property listing

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Modern Apartment in Downtown",
  "description": "Beautiful 2-bedroom apartment with river views",
  "price": 1500.00,
  "location": "Downtown",
  "property_type": "apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "square_feet": 900,
  "amenities": ["WiFi", "Parking", "Gym", "Laundry"]
}
```

**Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| title | string | Yes | 1-255 characters |
| description | string | Yes | 10+ characters |
| price | number | Yes | > 0 |
| location | string | Yes | 1-255 characters |
| property_type | enum | Yes | apartment \| house \| room \| condo \| townhouse |
| bedrooms | number | No | >= 0 |
| bathrooms | number | No | >= 0 |
| square_feet | number | No | >= 0 |
| amenities | array | No | Array of amenity names (max 20) |

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "Modern Apartment in Downtown",
    "description": "Beautiful 2-bedroom apartment with river views",
    "price": 1500.00,
    "location": "Downtown",
    "property_type": "apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "square_feet": 900,
    "landlord_id": 2,
    "status": "draft",
    "amenities": [
      { "id": 1, "name": "WiFi" },
      { "id": 2, "name": "Parking" },
      { "id": 5, "name": "Gym" },
      { "id": 8, "name": "Laundry" }
    ],
    "created_at": "2026-04-30T14:22:00Z"
  }
}
```

**Error Responses:**
- `400` - Invalid input
- `401` - Missing or invalid token
- `403` - User is not a landlord

---

#### Update Listing
**Endpoint:** `PUT /api/listings/:id`  
**Auth Required:** Yes (Bearer token, must be listing owner)  
**Description:** Update an existing listing (only owner/landlord can update)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Listing ID (required) |

**Request Body:** (same fields as create, all optional)
```json
{
  "title": "Updated Title",
  "price": 1600.00,
  "status": "published"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Listing updated successfully",
  "data": {
    "id": 42,
    "title": "Updated Title",
    "price": 1600.00,
    "status": "published",
    ...
  }
}
```

**Error Responses:**
- `400` - Invalid input
- `401` - Missing or invalid token
- `403` - Not listing owner
- `404` - Listing not found

---

#### Delete Listing
**Endpoint:** `DELETE /api/listings/:id`  
**Auth Required:** Yes (Bearer token, must be listing owner)  
**Description:** Soft-delete a listing (marks deleted_at timestamp, doesn't remove from DB)

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Listing ID (required) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Listing deleted successfully"
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `403` - Not listing owner
- `404` - Listing not found

---

### Photos Endpoints

#### Upload Photos to Listing
**Endpoint:** `POST /api/listings/:id/photos`  
**Auth Required:** Yes (Bearer token, must be listing owner)  
**Description:** Upload up to 10 photos for a listing

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Listing ID (required) |

**Form Data:**
- `photos` (file, array) - Image files (JPEG, PNG, WebP only)
  - Max 10 files total per listing
  - Max 5MB per file
  - Supported formats: image/jpeg, image/png, image/webp

**Example with cURL:**
```bash
curl -X POST http://localhost:5000/api/listings/1/photos \
  -H "Authorization: Bearer your-token" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "2 photos uploaded successfully",
  "data": {
    "listing_id": 1,
    "photos": [
      {
        "id": 101,
        "url": "/uploads/listing-1-photo-1.jpg",
        "public_id": "listing-1-photo-1",
        "created_at": "2026-04-30T15:00:00Z"
      },
      {
        "id": 102,
        "url": "/uploads/listing-1-photo-2.jpg",
        "public_id": "listing-1-photo-2",
        "created_at": "2026-04-30T15:00:01Z"
      }
    ]
  }
}
```

**Error Responses:**
- `400` - No photos uploaded, invalid file type, exceeds max photos
- `401` - Missing or invalid token
- `403` - Not listing owner
- `404` - Listing not found

---

#### Get Listing Photos
**Endpoint:** `GET /api/listings/:id/photos`  
**Auth Required:** No  
**Description:** Retrieve all photos for a listing

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Listing ID (required) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "listing_id": 1,
    "photos": [
      {
        "id": 101,
        "url": "/uploads/listing-1-photo-1.jpg",
        "public_id": "listing-1-photo-1",
        "created_at": "2026-04-30T15:00:00Z"
      },
      {
        "id": 102,
        "url": "/uploads/listing-1-photo-2.jpg",
        "public_id": "listing-1-photo-2",
        "created_at": "2026-04-30T15:00:01Z"
      }
    ]
  }
}
```

**Error Responses:**
- `404` - Listing not found

---

#### Delete Photo
**Endpoint:** `DELETE /api/listings/photos/:id`  
**Auth Required:** Yes (Bearer token, must own the listing)  
**Description:** Delete a specific photo from a listing

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Photo ID (required) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `403` - Not listing owner
- `404` - Photo not found

---

### Health Check Endpoint

#### Server Health Check
**Endpoint:** `GET /health`  
**Auth Required:** No  
**Description:** Check if server is running and database is connected

**Success Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-04-30T15:30:45Z"
}
```

**Error Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Database connection failed"
}
```

---

## Error Handling

All error responses follow a standard format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "details": {
      "field_name": ["Error for this field"]
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation failure |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 500 | Server Error | Database or server error |
| 503 | Service Unavailable | Database connection failed |

---

## Validation Rules

### Email Validation
- Must be valid email format
- Must be unique (no duplicates)
- Case-insensitive

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

### Listing Fields
- **title**: 1-255 characters, required
- **description**: 10+ characters, required
- **price**: Must be > 0, required
- **location**: 1-255 characters, required
- **property_type**: enum [apartment, house, room, condo, townhouse], required
- **bedrooms/bathrooms**: Non-negative integers
- **amenities**: Array of strings, max 20 items

### File Upload (Photos)
- Accepted formats: JPEG, PNG, WebP
- Max file size: 5MB per file
- Max files per listing: 10
- Stored location: `/uploads/` directory or cloud storage

---

## Rate Limiting

Currently no rate limiting is implemented. Rate limiting should be added before production deployment.

---

## CORS Policy

CORS is configured to allow requests from the frontend (localhost:3000 in development).

---

## Pagination

List endpoints support pagination with these parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

## Examples with cURL

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Get All Listings
```bash
curl http://localhost:5000/api/listings?page=1&limit=10
```

### Get Single Listing
```bash
curl http://localhost:5000/api/listings/1
```

### Create Listing (requires token)
```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cozy Apartment",
    "description": "Beautiful 2-bed apartment",
    "price": 1200.00,
    "location": "Downtown",
    "property_type": "apartment",
    "bedrooms": 2,
    "bathrooms": 1
  }'
```

### Upload Photos (requires token)
```bash
curl -X POST http://localhost:5000/api/listings/1/photos \
  -H "Authorization: Bearer your-jwt-token" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"
```

### Health Check
```bash
curl http://localhost:5000/health
```

---

## Authentication Flow Example

1. **Register** → POST /api/auth/register → Get JWT token
2. **Login** → POST /api/auth/login → Get JWT token (if already registered)
3. **Use token** → Include in Authorization header for protected routes
4. **Token expiry** → Re-login when token expires (7 days)

```bash
# 1. Register
TOKEN=$(curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","role":"landlord"}' \
  | jq -r '.data.token')

# 2. Create listing with token
curl -X POST http://localhost:5000/api/listings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Apartment","description":"Nice apartment","price":1200,"location":"City","property_type":"apartment"}'

# 3. Upload photos with token
curl -X POST http://localhost:5000/api/listings/1/photos \
  -H "Authorization: Bearer $TOKEN" \
  -F "photos=@photo.jpg"
```

---

**Last Updated:** April 30, 2026  
**API Version:** 1.0.0  
**Status:** In Development
