import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ClubLogo } from "@/components/ui/ClubLogo";
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
    <div className="ambient-bg flex min-h-full items-center justify-center px-4 py-16">
      <form action={loginAction} className="glass-card w-full max-w-md rounded-2xl p-8">
        <div className="flex justify-center">
          <ClubLogo size="md" />
        </div>
        <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-gold">Admin</p>
        <h1 className="mt-2 text-center font-display text-3xl text-white">Prijava</h1>
        <p className="mt-2 text-center text-sm text-white/50">Samo za unos sastava, statistike i sadržaja kluba.</p>
        {error ? <p className="mt-4 text-center text-sm text-red">Pogrešan email ili lozinka.</p> : null}
        {process.env.NODE_ENV !== "production" && process.env.ADMIN_EMAIL ? (
          <p className="mt-4 text-center text-xs text-white/40">
            Lokalni admin nalog: {process.env.ADMIN_EMAIL} (lozinka iz ADMIN_PASSWORD u .env)
          </p>
        ) : null}
        <label className="mt-6 block text-sm text-white/80">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
          />
        </label>
        <label className="mt-4 block text-sm text-white/80">
          Lozinka
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
          />
        </label>
        <button type="submit" className="glass-pill mt-6 w-full py-2.5 text-sm font-semibold text-gold transition hover:bg-white/10">
          Prijavi se
        </button>
      </form>
    </div>
  );
}
