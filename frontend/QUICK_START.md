# Quick Start Guide - Student Housing Platform

## 🚀 Get Started in 2 Minutes

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env.local
# Update NEXT_PUBLIC_API_URL if your backend is on a different port
```

### Step 3: Start Development Server
```bash
pnpm dev
```

### Step 4: Open in Browser
Visit **http://localhost:3000**

---

## 📱 Test the Platform

### Try These Features:

#### 1. **Sign Up (Student)**
- Go to `/register`
- Select "Student" role
- Create an account with email/password
- Auto-redirected to homepage

#### 2. **Browse Properties**
- Click "Browse Listings" or go to `/search`
- Use filters (price, bedrooms, furnished)
- Click any property to view details

#### 3. **View Property Details**
- See full property info with gallery
- View reviews and ratings
- Click "Contact Landlord" to send inquiry

#### 4. **Sign Up (Landlord)**
- Log out and create new account as "Landlord"
- Go to `/landlord/listings/create`
- Fill in property details and upload images
- List published to platform

#### 5. **Manage Listings**
- Visit `/landlord/dashboard`
- View all your listings
- Edit or delete listings
- Update status (Available/Rented/Under Negotiation)

#### 6. **Student Dashboard**
- Log in as student
- Visit `/student/dashboard`
- View reviews and statistics
- See quick action buttons

#### 7. **Profile Management**
- Go to `/profile`
- Update personal information
- Change password
- View account settings

---

## 🏗️ Project Structure Quick Reference

```
/app               → Pages and routes
  /register        → Sign up page
  /login           → Login page
  /search          → Property search
  /listings/[id]   → Property detail
  /student         → Student pages
  /landlord        → Landlord pages
  /admin           → Admin pages

/components        → Reusable React components
/contexts          → State management (Auth)
/lib               → Utilities (API, validation)
```

---

## 🔧 Development Commands

```bash
# Start dev server with hot reload
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start

# Lint code
pnpm lint
```

---

## 📋 Pages & Routes

| Route | Description | Roles |
|-------|-------------|-------|
| `/` | Homepage | Public |
| `/register` | Sign up | Public |
| `/login` | Login | Public |
| `/forgot-password` | Password recovery | Public |
| `/reset-password` | Reset password | Public |
| `/search` | Search properties | Public |
| `/listings/:id` | Property details | Public |
| `/profile` | User profile | Student, Landlord |
| `/student/dashboard` | Student dashboard | Student |
| `/landlord/dashboard` | Landlord dashboard | Landlord |
| `/landlord/listings/create` | Create listing | Landlord |
| `/landlord/listings/:id/edit` | Edit listing | Landlord |
| `/admin/dashboard` | Admin panel | Admin |

---

## 🎨 Styling with Bootstrap

All pages use **Bootstrap 5** classes:

```jsx
// Container and Grid
<div className="container">
  <div className="row">
    <div className="col-md-6">Content</div>
  </div>
</div>

// Buttons
<button className="btn btn-primary">Primary</button>
<button className="btn btn-success">Success</button>

// Cards
<div className="card">
  <div className="card-header">Header</div>
  <div className="card-body">Body</div>
</div>

// Utilities
<div className="d-flex justify-content-center">
  <span className="text-muted">Centered text</span>
</div>
```

---

## 🔐 Authentication Flow

1. User submits registration/login form
2. Form data sent to backend API
3. Backend validates and returns JWT token
4. Token stored in HTTP-only cookie
5. AuthContext updates user state
6. Protected routes check `isAuthenticated`
7. User redirected if not logged in

---

## 🐛 Debugging Tips

### Check Auth State
```jsx
const { user, token, isAuthenticated } = useAuth();
console.log('[v0] User:', user);
```

### Monitor API Calls
- Open browser DevTools → Network tab
- Look for API requests to your backend
- Check response status and data

### Debug Components
```jsx
console.log('[v0] Component rendered:', props);
```

### Common Issues

**White screen?**
- Check browser console for errors
- Ensure backend API is running
- Try hard refresh (Ctrl+Shift+R)

**Form not submitting?**
- Check form validation errors in console
- Verify all required fields are filled
- Check network tab for API errors

**Styling issues?**
- Bootstrap CSS should load automatically
- Check if `app/globals.css` imports Bootstrap
- Clear browser cache

---

## 📦 Dependencies

Key packages installed:

```json
{
  "next": "16.2.4",
  "react": "19.2.0",
  "react-hook-form": "^7.0.0",
  "zod": "^3.0.0",
  "bootstrap": "^5.0.0",
  "@hookform/resolvers": "^3.0.0",
  "js-cookie": "^3.0.0"
}
```

---

## 🌐 API Integration

The frontend expects a backend API with endpoints like:

```
POST /api/auth/register
POST /api/auth/login
POST /api/listings
GET /api/listings
GET /api/listings/:id
```

Update `NEXT_PUBLIC_API_URL` in `.env.local` to point to your backend.

---

## 📚 Useful Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Bootstrap Docs**: https://getbootstrap.com/docs
- **React Hook Form**: https://react-hook-form.com
- **Zod Validation**: https://zod.dev

---

## ✅ Checklist Before Deployment

- [ ] Update API URL to production backend
- [ ] Remove console.log debugging statements
- [ ] Test all authentication flows
- [ ] Test all CRUD operations
- [ ] Test responsive design on mobile
- [ ] Verify all images load correctly
- [ ] Test error handling
- [ ] Check security headers
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS on backend

---

## 🚀 Deploy to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

The platform is production-ready and optimized for deployment!

---

**Happy coding! 🎉**

For more details, see:
- `README.md` - Full documentation
- `PROJECT_SUMMARY.md` - Comprehensive overview
- `.env.example` - Environment variables reference
