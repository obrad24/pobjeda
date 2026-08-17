import Link from "next/link";
import type { MatchListItem } from "@/lib/matches";
import { formatMatchTime, formatShortDate, roundLabel, scoreLabel } from "@/lib/format";
import { TeamCrest } from "@/components/ui/TeamCrest";

export function FixturesList({
  matches,
  ourTeamId,
  empty,
}: {
  matches: MatchListItem[];
  ourTeamId?: string;
  empty: string;
}) {
  if (matches.length === 0) {
    return <p className="rounded-xl border border-navy/10 bg-white px-4 py-6 text-sm text-muted">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-navy/10 overflow-hidden rounded-xl border border-navy/10 bg-white">
      {matches.map((match) => {
        const ours = ourTeamId ? match.homeTeamId === ourTeamId || match.awayTeamId === ourTeamId : false;
        return (
          <li key={match.id}>
            <Link
              href={`/utakmice/${match.id}`}
              className={`grid gap-3 px-4 py-3 transition hover:bg-cream sm:grid-cols-[7.5rem_1fr_auto] sm:items-center ${
                ours ? "bg-gold/10" : ""
              }`}
            >
              <div className="text-xs text-muted">
                <p>{roundLabel(match.round)}</p>
                <p>{formatShortDate(match.date)}</p>
                <p>{formatMatchTime(match.date, match.time)}</p>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <span className="flex items-center justify-end gap-2 text-right">
                  <span className="truncate font-medium text-navy">{match.homeTeam.sportdcName}</span>
                  <TeamCrest name={match.homeTeam.name} logo={match.homeTeam.logo} size="sm" />
                </span>
                <span className="min-w-[4.5rem] text-center font-display text-lg tabular-nums text-navy">
                  {scoreLabel(match)}
                </span>
                <span className="flex items-center gap-2">
                  <TeamCrest name={match.awayTeam.name} logo={match.awayTeam.logo} size="sm" />
                  <span className="truncate font-medium text-navy">{match.awayTeam.sportdcName}</span>
                </span>
              </div>
              <span className="hidden text-xs text-muted sm:block">{match.stadium ?? match.league.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function RoundFilter({
  rounds,
  selected,
}: {
  rounds: number[];
  selected?: number;
}) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      <FilterChip href="/rezultati" active={selected == null} label="Sva kola" />
      {rounds.map((round) => (
        <FilterChip
          key={round}
          href={`/rezultati?kolo=${round}`}
          active={selected === round}
          label={`${round}.`}
        />
      ))}
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
        active
          ? "border-gold bg-navy text-gold"
          : "border-navy/15 bg-white text-navy hover:border-gold"
      }`}
    >
      {label}
    </Link>
  );
}
