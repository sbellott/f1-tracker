import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/predictions',
  '/groups',
  '/profile',
  '/api/predictions',
  '/api/groups',
  '/api/users/me',
];

// Routes that should redirect authenticated users
const authRoutes = ['/login', '/register'];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const pathname = nextUrl.pathname;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname.startsWith(route)
  );

  // Check if route is an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/', nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and api routes that don't need auth
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/calendar|api/standings|api/drivers|api/constructors|api/circuits).*)',
  ],
};
