"use client";

import { useEffect, useState } from "react";
import { ClubLogo } from "@/components/ui/ClubLogo";

export function LoginForm({
  error,
  adminHint,
  defaultEmail,
}: {
  error: boolean;
  adminHint?: string;
  defaultEmail?: string;
}) {
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/csrf")
      .then((response) => response.json())
      .then((data: { csrfToken?: string }) => {
        if (!cancelled && data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCsrfToken("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <form
      method="post"
      action="/api/auth/callback/credentials"
      className="glass-card w-full max-w-md rounded-2xl p-8"
    >
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value="/admin" />
      <div className="flex justify-center">
        <ClubLogo size="md" />
      </div>
      <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-gold">Admin</p>
      <h1 className="mt-2 text-center font-display text-3xl text-white">Prijava</h1>
      <p className="mt-2 text-center text-sm text-white/50">Samo za unos sastava, statistike i sadržaja kluba.</p>
      {error ? <p className="mt-4 text-center text-sm text-red">Pogrešan email ili lozinka.</p> : null}
      {adminHint ? <p className="mt-4 text-center text-xs text-white/40">{adminHint}</p> : null}
      <label className="mt-6 block text-sm text-white/80">
        Email
        <input
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
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
      <button
        type="submit"
        disabled={!csrfToken}
        className="glass-pill mt-6 w-full py-2.5 text-sm font-semibold text-gold transition hover:bg-white/10 disabled:opacity-60"
      >
        {csrfToken ? "Prijavi se" : "Učitavanje…"}
      </button>
    </form>
  );
}
