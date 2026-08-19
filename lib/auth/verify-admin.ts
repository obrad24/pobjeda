import { compare, hash } from "bcryptjs";
import { Role } from "../../generated/prisma";
import { prisma } from "../db/prisma";
import { credentialsSchema } from "./credentials";

export async function verifyAdminCredentials(credentials: unknown) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] credentials parse failed", parsed.error.flatten());
    }
    return null;
  }

  const { email, password } = parsed.data;
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  const matchesEnv =
    process.env.NODE_ENV !== "production" &&
    Boolean(envEmail && envPassword) &&
    email === envEmail &&
    password === envPassword;

  if (matchesEnv && envEmail && envPassword) {
    const passwordHash = await hash(envPassword, 10);
    const user = await prisma.user.upsert({
      where: { email: envEmail },
      update: { passwordHash, role: Role.ADMIN },
      create: { email: envEmail, passwordHash, role: Role.ADMIN },
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== Role.ADMIN) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] no ADMIN user for", email);
    }
    return null;
  }

  const ok = await compare(password, user.passwordHash);
  if (!ok) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] password mismatch for", email);
    }
    return null;
  }

  return { id: user.id, email: user.email, role: user.role };
}
