import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/db/prisma";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(200),
});

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET je obavezan u produkciji");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Prijava",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Lozinka", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== "ADMIN") {
          return null;
        }

        const ok = await compare(parsed.data.password, user.passwordHash);
        if (!ok) {
          return null;
        }

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
});
