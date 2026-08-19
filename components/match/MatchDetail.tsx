import type { MatchDetail } from "@/lib/matches";
import { cardLabel, formatMatchDate, formatMatchTime, playerFullName, roundLabel, scoreLabel } from "@/lib/format";
import { TeamCrest } from "@/components/ui/TeamCrest";

function minuteLabel(minute: number | null | undefined) {
  return minute != null ? `${minute}'` : "";
}

export function MatchHero({ match }: { match: MatchDetail }) {
  const played = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;

  return (
    <section className="hero-panel text-white">
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          {roundLabel(match.round)} · {match.league.name}
        </p>
        <p className="mt-2 text-sm capitalize text-white/60">
          {formatMatchDate(match.date)} · {formatMatchTime(match.date, match.time)}
          {match.stadium ? ` · ${match.stadium}` : ""}
        </p>
        <div className="glass-card mt-8 grid items-center gap-6 rounded-2xl p-6 md:grid-cols-[1fr_auto_1fr]">
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
  if (match.goals.length === 0 && match.cards.length === 0 && match.substitutions.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display text-xl text-white">Golovi i asistencije</h2>
        {match.goals.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Nema unesenih golova.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {match.goals.map((goal) => (
              <li key={goal.id} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-white">{playerFullName(goal.player)}</span>
                  {goal.ownGoal ? <span className="text-white/50"> · autogol</span> : null}
                  {goal.assistPlayer ? (
                    <span className="text-white/50"> · as. {playerFullName(goal.assistPlayer)}</span>
                  ) : null}
                </span>
                <span className="tabular-nums text-gold">{minuteLabel(goal.minute)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display text-xl text-white">Kartoni</h2>
        {match.cards.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">Nema unesenih kartona.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {match.cards.map((card) => (
              <li key={card.id} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-white">{playerFullName(card.player)}</span>
                  <span className="text-white/50"> · {cardLabel(card.type)}</span>
                </span>
                <span className="tabular-nums text-gold">{minuteLabel(card.minute)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {match.substitutions.length > 0 ? (
        <div className="glass-card rounded-2xl p-5 md:col-span-2">
          <h2 className="font-display text-xl text-white">Zamjene</h2>
          <ul className="mt-4 divide-y divide-white/10">
            {match.substitutions.map((sub) => (
              <li key={sub.id} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-white">{playerFullName(sub.playerOut)}</span>
                  <span className="text-white/50"> → </span>
                  <span className="font-medium text-white">{playerFullName(sub.playerIn)}</span>
                </span>
                <span className="tabular-nums text-gold">{minuteLabel(sub.minute)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function MatchLineup({ match }: { match: MatchDetail }) {
  if (match.lineups.length === 0) {
    return (
      <p className="glass-card rounded-2xl px-4 py-6 text-sm text-white/50">
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
    <div className="glass-card overflow-hidden rounded-2xl">
      <h2 className="border-b border-white/10 px-4 py-3 font-display text-xl text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm text-white/50">{empty}</p>
      ) : (
        <div className="table-scroll">
          <table className="w-full min-w-0 text-sm text-white/80">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50">
                <th className="px-4 py-2 font-medium">Igrač</th>
                <th className="px-3 py-2 font-medium">Min</th>
                <th className="px-3 py-2 font-medium">Izmjena</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="px-4 py-2">
                    <span className="mr-2 font-display text-gold">{row.player.jerseyNumber ?? ""}</span>
                    {playerFullName(row.player)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{row.minutes ?? "—"}</td>
                  <td className="px-3 py-2 text-white/50">
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
