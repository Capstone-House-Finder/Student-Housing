# Student Housing Platform

A modern web application for students to find housing and landlords to manage their properties.

## Features

### For Students
- Browse and search for available student housing
- Filter properties by price, location, bedrooms, and amenities
- View detailed property information with photo galleries
- Submit inquiries to landlords
- Track housing negotiations from inquiry to signed agreement
- Leave reviews and ratings for properties and landlords
- View rental history and previous agreements
- Manage personal profile and preferences

### For Landlords
- Create and manage property listings
- Upload property photos and manage galleries
- Track student inquiries and negotiations
- View and respond to tenant reviews
- Approve or reject tenant applications
- View rental history and archived agreements
- Generate reports on property performance

### For Administrators
- Monitor all listings and users
- Review reported listings and users
- Manage platform content and policies
- View platform statistics and analytics
- Handle disputes and reports

## Tech Stack

- **Frontend**: Next.js 16, React 19, Bootstrap 5
- **Authentication**: JWT-based with HTTP-only cookies
- **Form Validation**: React Hook Form + Zod
- **State Management**: React Context API
- **Styling**: Bootstrap 5 CSS framework

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
pnpm install

# Create .env.local file
cp .env.example .env.local

# Update API endpoint in .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Running the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── (public)
│   ├── page.tsx           # Homepage
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── forgot-password/   # Password recovery
│   ├── reset-password/    # Password reset
│   ├── search/            # Property search
│   └── listings/[id]/     # Property detail
├── student/
│   ├── dashboard/         # Student dashboard
│   └── profile/           # Student profile
├── landlord/
│   ├── dashboard/         # Landlord dashboard
│   ├── listings/
│   │   ├── create/        # Create new listing
│   │   └── [id]/edit/     # Edit listing
├── admin/
│   └── dashboard/         # Admin dashboard
components/
├── Navbar.tsx             # Navigation bar
├── Footer.tsx             # Footer component
├── PropertyCard.tsx       # Property listing card
├── StarRating.tsx         # Star rating display
├── ReportModal.tsx        # Report modal
├── ContactLandlordModal.tsx # Contact modal
├── Reviews.tsx            # Reviews section
├── Pagination.tsx         # Pagination control
├── FiltersSidebar.tsx     # Search filters
├── ImageUpload.tsx        # Image upload component
├── ProtectedRoute.tsx     # Route protection wrapper
└── LoadingSpinner.tsx     # Loading indicator
contexts/
├── AuthContext.tsx        # Authentication context
lib/
├── api.ts                 # API client
├── validations.ts         # Zod schemas
└── utils.ts               # Utility functions
```

## API Integration

The application connects to a REST API backend. See `lib/api.ts` for the API client configuration.

### Authentication Flow
1. User registers or logs in
2. Backend returns JWT token in HTTP-only cookie
3. Token is automatically sent with subsequent requests
4. Token is cleared on logout

### Key Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /listings` - Get all listings
- `POST /listings` - Create new listing (landlord only)
- `GET /listings/:id` - Get listing details
- `POST /listings/:id/inquire` - Submit inquiry
- `GET /negotiations` - Get user negotiations
- `POST /listings/:id/reviews` - Submit review

## Features Implementation Details

### Search & Filtering
- Properties can be filtered by price range, bedrooms, and furnishing status
- Results are paginated with 12 items per page
- Search is client-side with Backend API integration

### Negotiations
- Students can submit inquiries for properties
- Landlords review and approve/reject inquiries
- Once approved, negotiations move to "under contract" status
- Landlords can verify approved tenants

### Reviews & Ratings
- Students can leave 1-5 star reviews after renting
- Landlords can reply to reviews
- Reviews are visible on property detail pages

### Reporting
- Users can report inappropriate listings
- Students can report landlords
- Reports are reviewed by admins

## Security Features

- Password hashing with bcrypt
- JWT authentication with HTTP-only cookies
- CSRF protection
- Input validation with Zod
- Role-based access control (RBAC)
- Protected routes that check user roles

## Development

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Code Quality
```bash
pnpm lint
```

## Deployment

The application can be deployed to Vercel or any Node.js hosting platform.

### Vercel Deployment
```bash
vercel
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please contact support@studenthousing.com
