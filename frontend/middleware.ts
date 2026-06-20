// frontend/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/landlord',
  '/student',
  '/profile',
  '/listings/create',
];

// Routes that redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Authentication token from cookies
  const token = request.cookies.get('authToken')?.value;
  const isAuthenticated = !!token;
  // After authentication check, verify email status
  if (isAuthenticated) {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const meResponse = await fetch(`${apiBase}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meResponse.json();
      if (meData.success && meData.data && meData.data.user && meData.data.user.email_verified === false) {
        // Allow access to verification pages
        if (!pathname.startsWith('/verify-pending') && !pathname.startsWith('/verify-email')) {
          return NextResponse.redirect(new URL('/verify-pending', request.url));
        }
      }
    } catch (e) {
      // ignore errors, proceed normally
    }
  }

  // Redirect authenticated users away from login/register pages
  if (authRoutes.some(route => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect routes that require authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login page with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};