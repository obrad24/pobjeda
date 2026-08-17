import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "../db/prisma";

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  const role = session?.user?.role;

  if (!email || role !== "ADMIN") {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return { id: user.id, email: user.email, role: user.role };
}
