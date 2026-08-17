import type { StandingRow } from "@/lib/league";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="table-scroll rounded-xl border border-navy/10 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-navy text-white">
          <tr className="text-left">
            <th className="px-3 py-3 font-medium">#</th>
            <th className="px-3 py-3 font-medium">Tim</th>
            <th className="px-2 py-3 text-center font-medium">Odg</th>
            <th className="px-2 py-3 text-center font-medium">P</th>
            <th className="px-2 py-3 text-center font-medium">N</th>
            <th className="px-2 py-3 text-center font-medium">I</th>
            <th className="px-2 py-3 text-center font-medium">Gol</th>
            <th className="px-2 py-3 text-center font-medium">GR</th>
            <th className="px-3 py-3 text-center font-medium">Bod</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.team.id}
              className={
                row.team.isOurTeam
                  ? "bg-gold/25 font-semibold text-navy"
                  : index === 6
                    ? "border-t-2 border-navy/20"
                    : "border-t border-navy/10"
              }
            >
              <td className="px-3 py-2.5 tabular-nums">{row.position}</td>
              <td className="px-3 py-2.5">
                <span className="block">{row.team.name}</span>
                {row.team.city ? <span className="text-xs font-normal text-muted">{row.team.city}</span> : null}
              </td>
              <td className="px-2 py-2.5 text-center tabular-nums">{row.played}</td>
              <td className="px-2 py-2.5 text-center tabular-nums">{row.won}</td>
              <td className="px-2 py-2.5 text-center tabular-nums">{row.drawn}</td>
              <td className="px-2 py-2.5 text-center tabular-nums">{row.lost}</td>
              <td className="px-2 py-2.5 text-center tabular-nums">
                {row.goalsFor}:{row.goalsAgainst}
              </td>
              <td className="px-2 py-2.5 text-center tabular-nums">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
              <td className="px-3 py-2.5 text-center font-display text-base tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
