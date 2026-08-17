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
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Sljedeća utakmica</p>
        <p className="mt-2 text-sm text-white/70">
          {roundLabel(match.round)} · {match.league.name}
        </p>

        <div className="mt-8 grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
          <TeamBlock team={match.homeTeam} align="right" preload />
          <div className="text-center">
            <p className="font-display text-3xl font-semibold tracking-[0.2em] text-gold sm:text-4xl">VS</p>
            <p className="mt-3 text-sm capitalize text-white/80">{formatMatchDate(match.date)}</p>
            <p className="font-display text-2xl tabular-nums text-white">{formatMatchTime(match.date, match.time)}</p>
          </div>
          <TeamBlock team={match.awayTeam} align="left" preload />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-gold/25 pt-5 text-sm text-white/75">
          {match.stadium ? <span>{match.stadium}</span> : null}
          <Link href={`/utakmice/${match.id}`} className="text-gold hover:text-gold-light">
            Detalji utakmice
          </Link>
        </div>
      </div>
    </section>
  );
}

function TeamBlock({
  team,
  align,
  preload,
}: {
  team: MatchListItem["homeTeam"];
  align: "left" | "right";
  preload?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 ${align === "right" ? "md:flex-row-reverse" : ""}`}>
      <TeamCrest name={team.name} logo={team.logo} size="lg" preload={preload} />
      <div className={align === "right" ? "md:text-right" : ""}>
        <p className="font-display text-xl font-semibold leading-tight sm:text-2xl">{team.name}</p>
        {team.city ? <p className="mt-1 text-sm text-gold/90">{team.city}</p> : null}
      </div>
    </div>
  );
}

export function NextMatchEmpty() {
  return (
    <section className="hero-panel text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">FK Pobjeda Triješnica</p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Raspored sezone</h1>
        <p className="mt-4 max-w-xl text-white/75">
          Sljedeća utakmica će se prikazati čim bude zakazana u ligi.
        </p>
      </div>
    </section>
  );
}
