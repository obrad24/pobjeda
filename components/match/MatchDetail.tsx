import type { MatchDetail } from "@/lib/matches";
import { cardLabel, formatMatchDate, formatMatchTime, playerFullName, roundLabel, scoreLabel } from "@/lib/format";
import { TeamCrest } from "@/components/ui/TeamCrest";

export function MatchHero({ match }: { match: MatchDetail }) {
  const played = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;

  return (
    <section className="hero-panel text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          {roundLabel(match.round)} · {match.league.name}
        </p>
        <p className="mt-2 text-sm capitalize text-white/75">
          {formatMatchDate(match.date)} · {formatMatchTime(match.date, match.time)}
          {match.stadium ? ` · ${match.stadium}` : ""}
        </p>
        <div className="mt-8 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-3 md:justify-end">
            <TeamCrest name={match.homeTeam.name} logo={match.homeTeam.logo} size="lg" preload />
            <p className="font-display text-xl sm:text-2xl">{match.homeTeam.name}</p>
          </div>
          <p className="text-center font-display text-4xl tabular-nums text-gold sm:text-5xl">
            {played ? scoreLabel(match) : "vs"}
          </p>
          <div className="flex items-center gap-3">
            <TeamCrest name={match.awayTeam.name} logo={match.awayTeam.logo} size="lg" preload />
            <p className="font-display text-xl sm:text-2xl">{match.awayTeam.name}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MatchEvents({ match }: { match: MatchDetail }) {
  if (match.goals.length === 0 && match.cards.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-navy/10 bg-white p-5">
        <h2 className="font-display text-xl text-navy">Golovi i asistencije</h2>
        {match.goals.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nema unesenih golova.</p>
        ) : (
          <ul className="mt-4 divide-y divide-navy/10">
            {match.goals.map((goal) => (
              <li key={goal.id} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-navy">{playerFullName(goal.player)}</span>
                  {goal.assistPlayer ? (
                    <span className="text-muted"> · as. {playerFullName(goal.assistPlayer)}</span>
                  ) : null}
                </span>
                <span className="tabular-nums text-gold-dark">{goal.minute}&apos;</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-xl border border-navy/10 bg-white p-5">
        <h2 className="font-display text-xl text-navy">Kartoni</h2>
        {match.cards.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nema unesenih kartona.</p>
        ) : (
          <ul className="mt-4 divide-y divide-navy/10">
            {match.cards.map((card) => (
              <li key={card.id} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-navy">{playerFullName(card.player)}</span>
                  <span className="text-muted"> · {cardLabel(card.type)}</span>
                </span>
                <span className="tabular-nums text-gold-dark">{card.minute}&apos;</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MatchLineup({ match }: { match: MatchDetail }) {
  if (match.lineups.length === 0) {
    return (
      <p className="rounded-xl border border-navy/10 bg-white px-4 py-6 text-sm text-muted">
        Sastav još nije unesen. Za utakmice lige bez klupskog unosa prikazuju se samo par, kolo i rezultat.
      </p>
    );
  }

  const starters = match.lineups.filter((row) => row.starter);
  const subs = match.lineups.filter((row) => !row.starter);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <LineupTable title="Prva postava" rows={starters} />
      <LineupTable title="Izmjene" rows={subs} empty="Nema unesenih izmjena." />
    </div>
  );
}

function LineupTable({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: MatchDetail["lineups"];
  empty?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-navy/10 bg-white">
      <h2 className="border-b border-navy/10 px-4 py-3 font-display text-xl text-navy">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm text-muted">{empty}</p>
      ) : (
        <div className="table-scroll">
          <table className="w-full min-w-0 text-sm">
            <thead className="bg-cream text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Igrač</th>
                <th className="px-3 py-2 font-medium">Min</th>
                <th className="px-3 py-2 font-medium">Izmjena</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-navy/10">
                  <td className="px-4 py-2">
                    <span className="mr-2 font-display text-gold">{row.player.jerseyNumber ?? ""}</span>
                    {playerFullName(row.player)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{row.minutes ?? "—"}</td>
                  <td className="px-3 py-2 text-muted">
                    {[
                      row.enteredAt != null ? `ušao ${row.enteredAt}'` : null,
                      row.substitutedAt != null ? `izašao ${row.substitutedAt}'` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
