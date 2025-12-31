/**
 * NextAuth.js Edge-compatible configuration
 *
 * This file contains the base auth configuration that can run in Edge Runtime.
 * It excludes Prisma adapter and database operations.
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Base auth configuration (Edge-compatible)
 * Used by middleware for route protection
 */
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Credentials provider placeholder for Edge
    // Actual authorization happens in config.ts with Prisma
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      // This authorize function won't be called in middleware
      // It's just needed to satisfy the type requirements
      authorize: () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Define protected routes
      const protectedPaths = ["/predictions", "/groups", "/profile"];
      const protectedApiPaths = [
        "/api/predictions",
        "/api/groups",
        "/api/users/me",
      ];
      const authPaths = ["/login", "/register"];

      const isProtectedPage = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );
      const isProtectedApi = protectedApiPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );
      const isAuthPage = authPaths.some((path) => nextUrl.pathname === path);

      // Redirect logged-in users away from auth pages
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl.origin));
      }

      // Protect pages and APIs
      if (isProtectedPage || isProtectedApi) {
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.pseudo = (user as { pseudo?: string }).pseudo;
      }

      // Handle session update
      if (trigger === "update" && session) {
        token.name = session.user?.name;
        token.pseudo = session.user?.pseudo;
        token.picture = session.user?.image;
      }

      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.pseudo = token.pseudo as string | undefined;
      }
      return session;
    },
  },
};
