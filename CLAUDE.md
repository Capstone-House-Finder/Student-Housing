# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack house rental platform with:
- Frontend: Next.js 16 application for landlords to create property listings
- Backend: Express.js API for managing listings, authentication, and database operations
- Database: MySQL for storing listings, users, amenities, and photos

## Architecture Structure

### Backend (Express.js API)
- Entry point: `backend/src/app.js`
- Routes: `backend/src/Routes/` - REST endpoints for listing operations
- Controllers: `backend/src/controllers/` - Business logic for listings
- Middleware: `backend/src/middleware/` - Authentication with JWT
- Config: `backend/src/config/` - Database and file upload configuration
- Tests: `backend/src/controllers/*.test.js` - Unit tests with Jest

Key features:
- Protected routes using JWT token authentication
- Multi-step listing creation with amenities and photo uploads
- Local file storage for uploaded images
- Transactional database operations for data consistency

### Frontend (Next.js)
- Entry point: `frontend/src/app/page.tsx`
- Landlord listing creation: `frontend/src/app/landlord/listings/create/`
- Component structure: Multi-step form with Details → Amenities → Photos → Review
- State management: Custom hook `useCreateListing` handles form state and API calls
- Styling: CSS modules and inline styles

## Common Development Commands

### Backend
```bash
# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Run tests with watcher
npm test -- --watch
```

### Frontend
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Listings
- POST `/api/listings` - Create new listing (requires auth)
- POST `/api/listings/:id/photos` - Upload photos for listing (requires auth)
- GET `/api/listings/:id` - Retrieve listing details (public)

### Authentication
- Uses JWT Bearer tokens in Authorization header
- Middleware automatically validates tokens and attaches user data to req.user

## Database Schema

The application expects a MySQL database with tables for:
- listings: Property listings with title, description, location, price, property_type
- amenities: Available property amenities
- listing_amenities: Junction table connecting listings to amenities
- listing_photos: Photo URLs associated with listings
- users: Landlords and tenants (authentication handled separately)

## Testing

Backend tests use Jest for unit testing controller logic:
- Located in `backend/src/controllers/*.test.js`
- Tests focus on input validation and error handling
- Mock HTTP request/response objects for isolated testing

Frontend tests use Jest with React Testing Library:
- Run with `npm test` or `npm run test:watch`

## File Uploads

- Photos are stored locally in `backend/uploads/` directory
- Multer handles file parsing and storage
- Files are renamed with timestamp+random suffix for uniqueness
- Maximum 10 photos per listing, 5MB size limit per file

## Environment Variables

Backend requires these environment variables (see `backend/.env`):
- DB_HOST: Database host (default: localhost)
- DB_USER: Database username (default: root)
- DB_PASSWORD: Database password (empty by default)
- DB_NAME: Database name
- PORT: Server port (default: 5000)
- NODE_ENV: Environment (development/production)
- JWT_SECRET: Secret for signing authentication tokens (needed for production)