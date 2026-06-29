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
  let isAuthenticated = !!token;

  // After authentication check, verify email status and token validity
  if (isAuthenticated) {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const meResponse = await fetch(`${apiBase}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Token rejected by backend (expired, malformed, revoked) — treat as unauthenticated
      if (meResponse.status === 401) {
        isAuthenticated = false;
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        const resp = NextResponse.redirect(loginUrl);
        resp.cookies.delete('authToken');
        resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        return resp;
      }

      const meData = await meResponse.json();
      if (meData.success && meData.data && meData.data.user && meData.data.user.email_verified === false) {
        // Allow access to verification pages
        if (!pathname.startsWith('/verify-pending') && !pathname.startsWith('/verify-email')) {
          const resp = NextResponse.redirect(new URL('/verify-pending', request.url));
          resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
          return resp;
        }
      }
    } catch (_e) {
      // Network error — proceed without blocking
    }
  }

  // Redirect /dashboard to the role-specific dashboard if authenticated
  if (pathname === '/dashboard') {
    if (isAuthenticated && token) {
      const role = getRoleFromToken(token);
      const dashboardPath = role === 'admin'
        ? '/admin/dashboard'
        : role === 'landlord'
          ? '/landlord/dashboard'
          : '/student/dashboard';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  // Redirect authenticated users away from login/register pages
  if (authRoutes.some(route => pathname.startsWith(route)) && isAuthenticated) {
    const resp = NextResponse.redirect(new URL('/dashboard', request.url));
    resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return resp;
  }

  // Protect routes that require authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login page with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const resp = NextResponse.redirect(loginUrl);
    resp.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return resp;
  }

  // For protected pages that ARE authenticated, prevent browser from caching them
  const response = NextResponse.next();
  if (isProtectedRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  return response;
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