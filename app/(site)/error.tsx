"use client";

import { publicErrorMessage } from "@/lib/errors";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-3xl text-navy">Došlo je do greške</h1>
      <p className="mt-3 text-sm text-muted">{publicErrorMessage(error)}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-navy px-5 py-2 text-sm text-gold"
      >
        Pokušaj ponovo
      </button>
    </div>
  );
}
