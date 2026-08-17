import Link from "next/link";
import { PlayerPhoto } from "@/components/players/PlayerCard";
import { fantasyPositionLabel } from "@/lib/fantasy";
import type { FantasyGameweekRow } from "@/lib/fantasy/standings";
import { playerFullName } from "@/lib/format";

export function PlayerOfTheRound({ player }: { player: FantasyGameweekRow }) {
  return (
    <Link
      href={`/igraci/${player.player.slug}`}
      className="flex gap-5 overflow-hidden rounded-2xl border border-gold/40 bg-navy p-5 text-white shadow-sm transition hover:border-gold"
    >
      <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-navy-dark sm:h-36 sm:w-28">
        <PlayerPhoto player={player.player} size="md" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Fantasy igrač kola</p>
        <h2 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">{playerFullName(player.player)}</h2>
        <p className="mt-1 text-sm text-white/70">{fantasyPositionLabel(player.position)}</p>
        <p className="mt-4 font-display text-4xl tabular-nums text-gold">{player.points}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-white/60">bodova</p>
      </div>
    </Link>
  );
}
