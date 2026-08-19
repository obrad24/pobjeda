import Image from "next/image";
import Link from "next/link";
import type { Player } from "../../generated/prisma";
import type { MatchListItem } from "@/lib/matches";
import { formatMatchTime, formatShortDate, positionLabel } from "@/lib/format";
import { TeamCrest } from "@/components/ui/TeamCrest";
import { PlayerPhoto } from "./PlayerCard";

export function PlayerPosterHero({
  player,
  stats,
  nextMatch,
}: {
  player: Pick<Player, "firstName" | "lastName" | "image" | "jerseyNumber" | "position" | "birthYear">;
  stats: { hasData: boolean; goals: number; minutes: number; appearances: number };
  nextMatch?: MatchListItem | null;
}) {
  const remote = Boolean(player.image?.startsWith("http"));

  return (
    <section className="player-poster relative min-h-[calc(100svh-16.5rem)] overflow-hidden sm:min-h-160">
      {player.image ? (
        <>
          <Image
            src={player.image}
            alt=""
            width={480}
            height={720}
            aria-hidden
            unoptimized={remote}
            className="pointer-events-none absolute left-[-18%] top-[8%] h-[78%] w-auto opacity-[0.16] blur-[0.4px]"
          />
          <Image
            src={player.image}
            alt=""
            width={400}
            height={600}
            aria-hidden
            unoptimized={remote}
            className="pointer-events-none absolute right-[-22%] top-[22%] h-[62%] w-auto scale-x-[-1] opacity-[0.11]"
          />
        </>
      ) : null}

      <p className="absolute left-4 top-4 z-20 text-[11px] font-bold uppercase tracking-[0.22em] text-white sm:left-8 sm:top-6 sm:text-xs">
        {player.firstName} {player.lastName}
      </p>
      <p className="absolute left-4 top-9 z-20 text-[11px] text-white/70 sm:left-8 sm:top-12">
        {positionLabel(player.position)}
        {player.birthYear ? ` · ${player.birthYear}` : ""}
      </p>
      {player.jerseyNumber != null ? (
        <p className="pointer-events-none absolute right-4 top-3 z-20 font-display text-5xl font-black tabular-nums text-white/25 sm:right-8 sm:text-7xl">
          {player.jerseyNumber}
        </p>
      ) : null}

      <h1 className="pointer-events-none absolute inset-x-0 top-8 text-right z-0 px-5  font-display font-black uppercase italic leading-[0.88] tracking-tight text-white sm:top-[32%] sm:px-8">
        <span className="block text-[clamp(1.85rem,10vw,4.25rem)]">{player.firstName}</span>
        <span className="block text-[clamp(2.15rem,14vw,5rem)]">{player.lastName}</span>
      </h1>

      <div className="absolute inset-x-0 bottom-0 top-8 z-10 mx-auto w-[min(95%,26rem)] sm:w-[min(70%,28rem)]">
        <PlayerPhoto player={player} size="lg" priority />
      </div>

      <div className="absolute inset-x-0 bottom-3 z-20 flex items-end gap-2 overflow-x-auto overscroll-x-contain px-3 sm:bottom-4 sm:px-6">
        {nextMatch ? (
          <Link
            href={`/utakmice/${nextMatch.id}`}
            prefetch={false}
            className="flex min-w-52 shrink-0 overflow-hidden rounded-xl shadow-lg"
          >
            <span className="flex-1">
              <span className="flex items-center justify-between bg-black px-2.5 py-1 text-white">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em]">Sljedeća utakmica</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px]">→</span>
              </span>
              <span className="flex items-center justify-between gap-2 bg-white px-2 py-1 text-navy">
                <TeamCrest name={nextMatch.homeTeam.name} logo={nextMatch.homeTeam.logo} size="xs" />
                <span className="min-w-0 text-center">
                  <span className="block text-[9px] leading-tight text-navy/50">{formatShortDate(nextMatch.date)}</span>
                  <span className="block text-[11px] font-semibold leading-tight">
                    {formatMatchTime(nextMatch.date, nextMatch.time)}
                  </span>
                </span>
                <TeamCrest name={nextMatch.awayTeam.name} logo={nextMatch.awayTeam.logo} size="xs" />
              </span>
            </span>
          </Link>
        ) : null}

        {stats.hasData ? (
          <>
            <PosterStat label="Golovi" value={stats.goals} />
            <PosterStat label="Nastupi" value={stats.appearances} />
            <PosterStat label="Minute" value={stats.minutes} />
          </>
        ) : null}
      </div>
    </section>
  );
}

function PosterStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-18 shrink-0 overflow-hidden rounded-xl shadow-lg">
      <p className="bg-black px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">{label}</p>
      <p className="bg-white px-2.5 py-1 font-display text-xl font-bold tabular-nums leading-none text-navy">
        {value}
      </p>
    </div>
  );
}
