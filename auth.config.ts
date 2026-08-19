import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma). Used by `proxy.ts`.
 * Credentials + bcrypt live in `auth.ts` (Node).
 */
export const authConfig = {
  trustHost: true,
  basePath: "/api/auth",
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  logger: {
    error(error) {
      if (
        error.name === "JWTSessionError" ||
        error.name === "SessionTokenError" ||
        error.name === "CredentialsSignin"
      ) {
        return;
      }
      console.error(error);
    },
  },
  callbacks: {
    authorized({ auth, request }) {
      if (!request.nextUrl.pathname.startsWith("/admin")) {
        return true;
      }
      return auth?.user?.role === "ADMIN";
    },
    jwt({ token, user }) {
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = typeof token.role === "string" ? token.role : "";
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
