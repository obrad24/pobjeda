import Link from "next/link";
import type { PlayerSeasonStats } from "@/lib/stats";
import { playerFullName } from "@/lib/format";

export const STAT_SORTS = [
  { id: "name", label: "Ime" },
  { id: "appearances", label: "Nastupi" },
  { id: "minutes", label: "Minute" },
  { id: "goals", label: "Golovi" },
  { id: "assists", label: "Asistencije" },
  { id: "yellowCards", label: "Žuti" },
  { id: "redCards", label: "Crveni" },
] as const;

export type StatSort = (typeof STAT_SORTS)[number]["id"];

export function sortPlayerStats(rows: PlayerSeasonStats[], sort: StatSort): PlayerSeasonStats[] {
  return [...rows].sort((a, b) => {
    if (sort === "name") {
      return playerFullName(a.player).localeCompare(playerFullName(b.player), "sr-Latn");
    }
    if (b[sort] !== a[sort]) {
      return b[sort] - a[sort];
    }
    return playerFullName(a.player).localeCompare(playerFullName(b.player), "sr-Latn");
  });
}

export function StatsTable({ rows, sort }: { rows: PlayerSeasonStats[]; sort: StatSort }) {
  return (
    <div className="table-scroll glass-card overflow-hidden rounded-2xl">
      <table className="w-full border-collapse text-sm text-white/80">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/60">
            {STAT_SORTS.map((column) => (
              <th
                key={column.id}
                className={`px-3 py-3 font-medium ${column.id === "name" ? "sticky-col" : "text-center"}`}
              >
                <Link
                  href={`/statistika?sort=${column.id}`}
                  prefetch={false}
                  className={sort === column.id ? "text-gold" : "text-white/60 hover:text-gold-light"}
                >
                  {column.label}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId} className="border-t border-white/5">
              <td className="sticky-col px-3 py-2.5">
                <Link href={`/igraci/${row.player.slug}`} prefetch={false} className="font-medium text-white hover:text-gold">
                  {playerFullName(row.player)}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-center tabular-nums">{row.appearances}</td>
              <td className="px-3 py-2.5 text-center tabular-nums">{row.minutes}</td>
              <td className="px-3 py-2.5 text-center tabular-nums">{row.goals}</td>
              <td className="px-3 py-2.5 text-center tabular-nums">{row.assists}</td>
              <td className="px-3 py-2.5 text-center tabular-nums">{row.yellowCards}</td>
              <td className="px-3 py-2.5 text-center tabular-nums">{row.redCards}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
