/**
 * Edge Middleware
 *
 * This middleware runs on Edge Runtime and handles:
 * - Route protection for authenticated users
 * - Redirect logic for auth pages
 *
 * Uses the Edge-compatible auth config (without Prisma)
 */

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

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
