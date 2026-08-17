import { BREAKDOWN_ROWS, formatSignedPoints } from "@/lib/fantasy/display";
import type { FantasyBreakdown } from "@/lib/fantasy";

export function FantasyBreakdownList({ breakdown }: { breakdown: FantasyBreakdown }) {
  const rows = BREAKDOWN_ROWS.filter((row) => breakdown[row.key] !== 0);

  if (rows.length === 0) {
    return <p className="text-sm text-muted">Nema bodova za ovaj nastup.</p>;
  }

  return (
    <dl className="space-y-1 text-sm">
      {rows.map((row) => (
        <div key={row.key} className="flex justify-between gap-4 tabular-nums">
          <dt className="text-muted">{row.label}</dt>
          <dd className={breakdown[row.key] < 0 ? "text-red" : "text-navy"}>{formatSignedPoints(breakdown[row.key])}</dd>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-navy/10 pt-2 font-display text-lg">
        <dt>Ukupno</dt>
        <dd className="tabular-nums">{breakdown.total}</dd>
      </div>
    </dl>
  );
}
