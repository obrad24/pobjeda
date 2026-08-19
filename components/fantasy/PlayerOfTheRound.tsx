import Link from "next/link";
import { PlayerPhoto } from "@/components/players/PlayerCard";
import { fantasyPositionLabel } from "@/lib/fantasy";
import type { FantasyGameweekRow } from "@/lib/fantasy/standings";
import { playerFullName } from "@/lib/format";

export function PlayerOfTheRound({ player }: { player: FantasyGameweekRow }) {
  return (
    <Link
      href={`/igraci/${player.player.slug}`}
      prefetch={false}
      className="glass-card flex items-center gap-4 overflow-hidden rounded-xl border-purple/20 p-4 text-white transition"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-purple/30 bg-navy-dark">
        <PlayerPhoto player={player.player} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-light">Igrač kola</p>
        <h2 className="mt-0.5 truncate font-display text-xl leading-tight">{playerFullName(player.player)}</h2>
        <p className="text-xs text-white/50">{fantasyPositionLabel(player.position)}</p>
      </div>
      <div className="text-right">
        <p className="font-display text-3xl font-bold tabular-nums text-purple-light">{player.points}</p>
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">bodova</p>
      </div>
    </Link>
  );
}
