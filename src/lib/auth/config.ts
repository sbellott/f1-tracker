import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import { signInSchema } from "@/lib/validations/auth.schema";
import { verifyPassword } from "./utils";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      pseudo?: string | null;
    };
  }

  interface User {
    pseudo?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    pseudo?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              password: true,
              pseudo: true,
              avatar: true,
            },
          });

          if (!user || !user.password) {
            return null;
          }

          const isValidPassword = await verifyPassword(password, user.password);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.pseudo,
            image: user.avatar,
            pseudo: user.pseudo,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.pseudo = user.pseudo;
      }

      // Handle session update (e.g., profile change)
      if (trigger === "update" && session) {
        token.name = session.user?.name;
        token.pseudo = session.user?.pseudo;
        token.picture = session.user?.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.pseudo = token.pseudo;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`[Auth] User signed in: ${user.email}`);
    },
    async signOut() {
      console.log("[Auth] User signed out");
    },
  },
  debug: process.env.NODE_ENV === "development",
});

/**
 * Get current session user (for server components/actions)
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non authentifié");
  }
  return user;
}
