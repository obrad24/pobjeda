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
            className={`block rounded-xl border p-4 ${
              row.rank === 1 ? "border-gold bg-gold/10" : "border-navy/10 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-navy">{playerFullName(row.player)}</p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  {row.rank}. · {fantasyPositionLabel(row.position)}
                </p>
              </div>
              <p className="font-display text-3xl tabular-nums text-gold">{row.points}</p>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted">
              <div>
                <dt>Prosjek</dt>
                <dd className="font-medium tabular-nums text-navy">{row.average.toFixed(1)}</dd>
              </div>
              <div>
                <dt>Nastupi</dt>
                <dd className="font-medium tabular-nums text-navy">{row.appearances}</dd>
              </div>
              <div>
                <dt>Forma</dt>
                <dd className="font-medium tabular-nums text-navy">{row.form.join(" · ") || "—"}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-navy text-white">
            <tr className="text-left">
              <th className="px-3 py-3 font-medium">#</th>
              <th className="px-3 py-3 font-medium">Igrač</th>
              <th className="px-3 py-3 font-medium">Pozicija</th>
              {COLUMNS.map((column) => (
                <th key={column.id} className="px-3 py-3 text-center font-medium">
                  <Link
                    href={hrefFor(column.id, query)}
                    prefetch={false}
                    className={sort === column.id ? "text-gold" : "text-white hover:text-gold-light"}
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
                className={`border-t border-navy/10 ${row.rank === 1 ? "bg-gold/15" : ""}`}
              >
                <td className="px-3 py-3 font-display tabular-nums text-gold">{row.rank}</td>
                <td className="px-3 py-3">
                  <Link href={`/igraci/${row.player.slug}`} prefetch={false} className="font-medium text-navy hover:text-gold-dark">
                    {playerFullName(row.player)}
                  </Link>
                </td>
                <td className="px-3 py-3 text-muted">{fantasyPositionLabel(row.position)}</td>
                <td className="px-3 py-3 text-center font-display text-lg tabular-nums">{row.points}</td>
                <td className="px-3 py-3 text-center tabular-nums">{row.average.toFixed(1)}</td>
                <td className="px-3 py-3 text-center tabular-nums">{row.goals}</td>
                <td className="px-3 py-3 text-center tabular-nums">{row.assists}</td>
                <td className="px-3 py-3 text-center tabular-nums">{row.appearances}</td>
                <td className="px-3 py-3 tabular-nums text-muted">{row.form.join(" · ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
