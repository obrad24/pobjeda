import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Prijava" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const isDev = process.env.NODE_ENV !== "production";
  const adminHint = isDev && process.env.ADMIN_EMAIL
    ? `Lokalni admin nalog: ${process.env.ADMIN_EMAIL} (lozinka iz ADMIN_PASSWORD u .env, bez navodnika)`
    : undefined;

  return (
    <div className="ambient-bg flex min-h-full items-center justify-center px-4 py-16">
      <LoginForm
        error={Boolean(error)}
        adminHint={adminHint}
        defaultEmail={isDev ? process.env.ADMIN_EMAIL : undefined}
      />
    </div>
  );
}
