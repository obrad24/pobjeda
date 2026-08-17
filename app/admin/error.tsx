"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg rounded-xl border border-red/20 bg-white p-6">
      <h1 className="font-display text-2xl text-navy">Greška u admin panelu</h1>
      <p className="mt-2 text-sm text-muted">{error.message || "Nešto nije u redu. Pokušajte ponovo."}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-full bg-navy px-4 py-2 text-sm text-gold"
      >
        Pokušaj ponovo
      </button>
    </div>
  );
}
