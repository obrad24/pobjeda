import Link from "next/link";
import { fantasyPositionLabel, type FantasySort } from "@/lib/fantasy";
import type { FantasyLeaderboardRow } from "@/lib/fantasy/standings";
import { playerFullName } from "@/lib/format";

const COLUMNS: Array<{ id: FantasySort; label: string }> = [
  { id: "points", label: "Bodovi" },
  { id: "average", label: "Prosjek" },
  { id: "goals", label: "Golovi" },
  { id: "assists", label: "Asistencije" },
  { id: "appearances", label: "Nastupi" },
];

function hrefFor(sort: FantasySort, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  params.set("sort", sort);
  return `/fantasy?${params.toString()}`;
}

export function FantasyLeaderboard({
  rows,
  sort,
  query,
}: {
  rows: FantasyLeaderboardRow[];
  sort: FantasySort;
  query: Record<string, string>;
}) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <Link
            key={row.playerId}
            href={`/igraci/${row.player.slug}`}
            prefetch={false}
            className={`glass-card block rounded-xl p-3 ${
              row.rank === 1 ? "border-purple/30 bg-purple/10" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-white">{playerFullName(row.player)}</p>
                <p className="text-xs uppercase tracking-wide text-white/50">
                  {row.rank}. · {fantasyPositionLabel(row.position)}
                </p>
              </div>
              <p className="font-display text-2xl tabular-nums text-purple-light">{row.points}</p>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/50">
              <div>
                <dt>Prosjek</dt>
                <dd className="font-medium tabular-nums text-white">{row.average.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Nastupi</dt>
                <dd className="font-medium tabular-nums text-white">{row.appearances}</dd>
              </div>
              <div>
                <dt>Forma</dt>
                <dd className="font-medium tabular-nums text-white">{row.form.join(" · ") || "—"}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>

      <div className="glass-card hidden overflow-hidden rounded-xl md:block">
        <table className="w-full border-collapse text-sm text-white/80">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/60">
              <th className="px-3 py-3 font-medium">#</th>
              <th className="px-3 py-3 font-medium">Igrač</th>
              <th className="px-3 py-3 font-medium">Pozicija</th>
              {COLUMNS.map((column) => (
                <th key={column.id} className="px-3 py-3 text-center font-medium">
                  <Link
                    href={hrefFor(column.id, query)}
                    prefetch={false}
                    className={sort === column.id ? "text-purple-light" : "text-white/60 hover:text-purple-light"}
                  >
                    {column.label}
                  </Link>
                </th>
              ))}
              <th className="px-3 py-3 font-medium">Forma</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.playerId}
                className={`border-t border-white/5 ${row.rank === 1 ? "bg-purple/10" : ""}`}
              >
                <td className="px-3 py-2.5 font-display tabular-nums text-purple-light">{row.rank}</td>
                <td className="px-3 py-2.5">
                  <Link href={`/igraci/${row.player.slug}`} prefetch={false} className="font-medium text-white hover:text-purple-light">
                    {playerFullName(row.player)}
                  </Link>
                </td>
                <td className="px-3 py-3 text-white/50">{fantasyPositionLabel(row.position)}</td>
                <td className="px-3 py-3 text-center font-display text-lg tabular-nums">{row.points}</td>
                <td className="px-3 py-3 text-center tabular-nums">{row.average.toFixed(1)}</td>
                <td className="px-3 py-3 text-center tabular-nums">{row.goals}</td>
                <td className="px-3 py-3 text-center tabular-nums">{row.assists}</td>
                <td className="px-3 py-3 text-center tabular-nums">{row.appearances}</td>
                <td className="px-3 py-3 tabular-nums text-white/50">{row.form.join(" · ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
