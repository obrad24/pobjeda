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
    return <p className="glass-card rounded-2xl px-4 py-6 text-sm text-white/50">{empty}</p>;
  }

  return (
    <ul className="glass-card divide-y divide-white/5 overflow-hidden rounded-2xl">
      {matches.map((match) => {
        const ours = ourTeamId ? match.homeTeamId === ourTeamId || match.awayTeamId === ourTeamId : false;
        return (
          <li key={match.id}>
            <Link
              href={`/utakmice/${match.id}`}
              prefetch={false}
              className={`block px-3 py-2.5 transition sm:px-4 ${
                ours
                  ? "bg-gold/20 hover:bg-gold/25"
                  : "hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span>{roundLabel(match.round)}</span>
                <span aria-hidden>·</span>
                <span>{formatShortDate(match.date)}</span>
                <span aria-hidden>·</span>
                <span>{formatMatchTime(match.date, match.time)}</span>
                <span className="ml-auto hidden truncate text-white/40 sm:inline">
                  {match.stadium ?? match.league.name}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <TeamCrest name={match.homeTeam.name} logo={match.homeTeam.logo} size="sm" />
                <span className="min-w-0 flex-1 truncate font-medium text-white">
                  {match.homeTeam.sportdcName}
                </span>
                <span className="shrink-0 px-1 font-display text-lg tabular-nums text-white">
                  {scoreLabel(match)}
                </span>
                <span className="min-w-0 flex-1 truncate text-right font-medium text-white">
                  {match.awayTeam.sportdcName}
                </span>
                <TeamCrest name={match.awayTeam.name} logo={match.awayTeam.logo} size="sm" />
              </div>
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
      prefetch={false}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-gold/40 bg-gold/15 text-gold"
          : "border-white/10 bg-white/5 text-white/70 hover:border-gold/30 hover:text-gold"
      }`}
    >
      {label}
    </Link>
  );
}
