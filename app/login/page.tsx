import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "./actions";

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

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <form action={loginAction} className="w-full max-w-md rounded-xl border border-navy/10 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-dark">Admin</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Prijava</h1>
        <p className="mt-2 text-sm text-muted">Samo za unos sastava, statistike i sadržaja kluba. Nema javne registracije.</p>
        {error ? <p className="mt-4 text-sm text-red">Pogrešan email ili lozinka.</p> : null}
        <label className="mt-6 block text-sm text-navy">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <label className="mt-4 block text-sm text-navy">
          Lozinka
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <button type="submit" className="mt-6 w-full rounded-full bg-navy py-2.5 text-sm text-gold hover:bg-navy-dark">
          Prijavi se
        </button>
      </form>
    </div>
  );
}
