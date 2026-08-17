"use client";

import { useState, useTransition } from "react";
import { recalculateFantasyAction } from "@/app/admin/fantasy/actions";

export function RecalculateFantasyButton({ seasonId }: { seasonId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        className="rounded-full bg-navy px-5 py-2.5 text-sm text-gold disabled:opacity-60"
        onClick={() => {
          startTransition(async () => {
            const result = await recalculateFantasyAction(seasonId);
            setMessage(`Preračunato: ${result.matches} utakmica, ${result.rows} unosa.`);
          });
        }}
      >
        {pending ? "Računam…" : "RECALCULATE FANTASY POINTS"}
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
