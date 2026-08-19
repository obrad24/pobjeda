import Link from "next/link";
import type { LeaderboardRow } from "@/lib/stats";
import { playerFullName } from "@/lib/format";
import { EmptyState } from "@/components/ui/Section";

export function HomeStats({
  scorers,
  assists,
  appearances,
}: {
  scorers: LeaderboardRow[];
  assists: LeaderboardRow[];
  appearances: LeaderboardRow[];
}) {
  const hasData = scorers.length + assists.length + appearances.length > 0;
  if (!hasData) {
    return (
      <EmptyState
        title="Statistika će biti dostupna nakon prvih utakmica"
        body="Golovi, asistencije i nastupi računaju se iz sastava i događaja koje unosi klub."
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatList title="Strijelci" rows={scorers} metric="goals" />
      <StatList title="Asistencije" rows={assists} metric="assists" />
      <StatList title="Nastupi" rows={appearances} metric="appearances" />
    </div>
  );
}

function StatList({
  title,
  rows,
  metric,
}: {
  title: string;
  rows: LeaderboardRow[];
  metric: "goals" | "assists" | "appearances";
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-display text-lg text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/50">Još nema unosa.</p>
      ) : (
        <ol className="mt-3 divide-y divide-white/10">
          {rows.map((row, index) => (
            <li key={row.playerId}>
              <Link
                href={`/igraci/${row.player.slug}`}
                prefetch={false}
                className="flex items-center justify-between gap-3 py-2.5 text-white/80 transition hover:text-purple-light"
              >
                <span className="min-w-0 truncate">
                  <span className="mr-2 font-display text-purple-light">{index + 1}</span>
                  {playerFullName(row.player)}
                </span>
                <span className="font-display tabular-nums text-white">{row[metric]}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
