import Link from "next/link";
import type { MatchListItem } from "@/lib/matches";
import {
  formatMatchDate,
  formatMatchTime,
  roundLabel,
} from "@/lib/format";
import { TeamCrest } from "@/components/ui/TeamCrest";

export function NextMatch({ match }: { match: MatchListItem }) {
  return (
    <section className="hero-panel text-white">
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="glass-card overflow-hidden rounded-2xl p-4 sm:p-6">
          {/* Top label */}
          <div className="mb-4 text-center">
            <p className="inline-block rounded-full bg-purple/20 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-light">
              {roundLabel(match.round)} · {match.league.name}
            </p>
          </div>

          {/* Match card: Home — VS — Away */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
            {/* Home team */}
            <div className="flex flex-col items-center text-center">
              <TeamCrest name={match.homeTeam.name} logo={match.homeTeam.logo} size="lg" preload />
              <p className="mt-3 font-display text-base font-semibold leading-tight sm:text-lg">
                {match.homeTeam.name}
              </p>
              {match.homeTeam.city && (
                <p className="mt-0.5 text-xs text-purple-light/60">{match.homeTeam.city}</p>
              )}
            </div>

            {/* Center: VS + time */}
            <div className="flex flex-col items-center">
              <span className="font-display text-xl font-bold tracking-wider text-purple-light sm:text-2xl">
                VS
              </span>
              <p className="mt-2 text-[11px] capitalize text-white/50">{formatMatchDate(match.date)}</p>
              <p className="font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">
                {formatMatchTime(match.date, match.time)}
              </p>
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center text-center">
              <TeamCrest name={match.awayTeam.name} logo={match.awayTeam.logo} size="lg" preload />
              <p className="mt-3 font-display text-base font-semibold leading-tight sm:text-lg">
                {match.awayTeam.name}
              </p>
              {match.awayTeam.city && (
                <p className="mt-0.5 text-xs text-purple-light/60">{match.awayTeam.city}</p>
              )}
            </div>
          </div>

          {/* Stadium */}
          {match.stadium && (
            <p className="mt-4 text-center text-xs text-white/40">{match.stadium}</p>
          )}
        </div>

        {/* Details link */}
        <div className="mt-3 flex justify-center">
          <Link
            href={`/utakmice/${match.id}`}
            className="rounded-full bg-purple/20 px-6 py-2 text-sm font-semibold text-purple-light transition hover:bg-purple/30"
          >
            Detalji utakmice
          </Link>
        </div>
      </div>
    </section>
  );
}

export function NextMatchEmpty() {
  return (
    <section className="hero-panel text-white">
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-light">
          FK Pobjeda Triješnica
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Raspored sezone</h1>
        <p className="mt-4 max-w-xl text-white/60">
          Sljedeća utakmica će se prikazati čim bude zakazana u ligi.
        </p>
      </div>
    </section>
  );
}
