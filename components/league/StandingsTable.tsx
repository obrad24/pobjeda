import type { StandingRow } from "@/lib/league";
import { TeamCrest } from "@/components/ui/TeamCrest";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="table-scroll standings-table glass-card overflow-hidden rounded-2xl">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/60">
            <th className="w-8 px-2 py-3 font-medium sm:w-10 sm:px-3">#</th>
            <th className="px-2 py-3 font-medium sm:px-3">Tim</th>
            <th className="w-9 px-1 py-3 text-center font-medium sm:w-12 sm:px-2">Odg</th>
            <th className="hidden px-2 py-3 text-center font-medium md:table-cell">P</th>
            <th className="hidden px-2 py-3 text-center font-medium md:table-cell">N</th>
            <th className="hidden px-2 py-3 text-center font-medium md:table-cell">I</th>
            <th className="hidden px-2 py-3 text-center font-medium md:table-cell">Gol</th>
            <th className="w-10 px-1 py-3 text-center font-medium sm:w-12 sm:px-2">GR</th>
            <th className="w-10 px-1 py-3 text-center font-medium sm:w-12 sm:px-3">Bod</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.team.id}
              className={
                row.team.isOurTeam
                  ? "bg-gold/10 font-semibold text-white"
                  : index === 6
                    ? "border-t border-white/20 text-white/80"
                    : "border-t border-white/5 text-white/80"
              }
            >
              <td className="px-2 py-2.5 tabular-nums sm:px-3">{row.position}</td>
              <td className="max-w-0 px-2 py-2.5 sm:px-3">
                <div className="flex min-w-0 items-center gap-2">
                  <TeamCrest name={row.team.name} logo={row.team.logo} size="sm" />
                  <div className="min-w-0">
                    <span className="block truncate text-white">{row.team.name}</span>
                    {row.team.city ? (
                      <span className="hidden truncate text-xs font-normal text-white/40 md:block">{row.team.city}</span>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-1 py-2.5 text-center tabular-nums sm:px-2">{row.played}</td>
              <td className="hidden px-2 py-2.5 text-center tabular-nums md:table-cell">{row.won}</td>
              <td className="hidden px-2 py-2.5 text-center tabular-nums md:table-cell">{row.drawn}</td>
              <td className="hidden px-2 py-2.5 text-center tabular-nums md:table-cell">{row.lost}</td>
              <td className="hidden px-2 py-2.5 text-center tabular-nums md:table-cell">
                {row.goalsFor}:{row.goalsAgainst}
              </td>
              <td className="px-1 py-2.5 text-center tabular-nums sm:px-2">
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </td>
              <td className="px-1 py-2.5 text-center font-display text-base tabular-nums text-gold sm:px-3">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
