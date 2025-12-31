import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Define protected routes
  const protectedPaths = [
    "/predictions",
    "/groups",
    "/profile",
  ];

  // Define protected API routes
  const protectedApiPaths = [
    "/api/predictions",
    "/api/groups",
    "/api/users/me",
  ];

  const isProtectedPage = protectedPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  const isProtectedApi = protectedApiPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected page without auth
  if (isProtectedPage && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Return 401 for protected API routes without auth
  if (isProtectedApi && !isLoggedIn) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Non authentifié",
        },
      },
      { status: 401 }
    );
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ["/login", "/register"];
  const isAuthPage = authPaths.some((path) => nextUrl.pathname === path);

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Protected pages
    "/predictions/:path*",
    "/groups/:path*",
    "/profile/:path*",
    // Protected API routes
    "/api/predictions/:path*",
    "/api/groups/:path*",
    "/api/users/:path*",
    // Auth pages (for redirect)
    "/login",
    "/register",
  ],
};
