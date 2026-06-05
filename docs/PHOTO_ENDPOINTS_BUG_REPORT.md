# Photo Endpoints Bug Report - FIXED ✅

**Date:** May 4, 2026  
**Branch:** `bugfix/photo-endpoints-tests`  
**Status:** RESOLVED  

---

## Issues Found & Fixed

### Issue 1: Route Parameter Mismatch in deletePhoto Tests

**Severity:** HIGH  
**Affected Tests:** 4 tests in `photoController.test.js`

**Root Cause:**
- Route definition: `router.delete('/photos/:photoId', ...)` uses parameter name `photoId`
- Controller reads: `req.params.photoId`
- Tests were passing: `{ id: photoId }` instead of `{ photoId: photoId }`

**Failing Tests:**
1. `should delete photo successfully` - Expected 200, got 400
2. `should return 404 if photo not found` - Expected 404, got 400
3. `should return 403 if user is not the listing owner` - Expected 403, got 400
4. `should handle DB errors gracefully` - Expected error, got 400 (invalid ID)

**Fix Applied:**
Updated all 5 deletePhoto test cases to use correct parameter name:
```javascript
// BEFORE
{ req, res, next } = mockReqRes({ id: String(photoId) }, {}, { id: landlordId })

// AFTER
{ req, res, next } = mockReqRes({ photoId: String(photoId) }, {}, { id: landlordId })
```

**Files Modified:**
- `backend/src/controllers/photoController.test.js` - 5 test cases updated

---

## Test Results

### Before Fix
```
FAIL  src/controllers/photoController.test.js
  ● 4 failing tests in deletePhoto suite
  
Test Suites: 1 failed, 2 passed
Tests:       4 failed, 36 passed
```

### After Fix
```
PASS  src/controllers/photoController.test.js
  ✓ All 11 photo endpoint tests passing

Test Suites: 3 passed
Tests:       40 passed, 0 failed
```

---

## Photo Endpoints Summary

### Routes Implemented

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/listings/:id/photos` | ✅ JWT | Upload photos to listing (max 10) |
| GET | `/api/listings/:id/photos` | ❌ Public | Get all photos for listing |
| DELETE | `/api/listings/photos/:photoId` | ✅ JWT | Delete single photo |

### Features Working
- ✅ File uploads via Postman (form-data with `photos` field)
- ✅ Cloudinary integration for image storage
- ✅ Automatic file organization in Cloudinary folders
- ✅ Ownership verification (only listing owner can upload/delete)
- ✅ Photo metadata storage in MySQL
- ✅ Cloudinary cleanup on photo deletion
- ✅ Error handling and graceful failures

### Configuration
- **Cloudinary Cloud Name:** `dl8hhsfhj` (from .env)
- **API Key:** Configured (from .env)
- **API Secret:** Configured (from .env)
- **Upload Folder Structure:** `student-housing/listing-{listingId}/`
- **File Limits:** 5MB per file, 10 files per request
- **Supported Formats:** JPEG, PNG, WebP

---

## Testing Notes

All photo controller tests cover:
- ✅ Successful photo uploads with Cloudinary
- ✅ Multiple file uploads in single request
- ✅ Max photos per listing validation (10 limit)
- ✅ Photo ownership verification
- ✅ Cloudinary deletion on photo delete
- ✅ Database error handling
- ✅ Invalid input validation

---

## Related Files
- `backend/src/Routes/listingRoutes.js` - Photo route definitions
- `backend/src/controllers/photoController.js` - Photo CRUD logic
- `backend/src/config/cloudinary.js` - Cloudinary configuration
- `backend/src/config/uploads.js` - Multer configuration
- `backend/src/controllers/photoController.test.js` - Photo endpoint tests

---

**Status:** ✅ **RESOLVED** - All tests passing, ready for production
