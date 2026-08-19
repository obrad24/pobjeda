import Link from "next/link";
import type { Player } from "../../generated/prisma";
import { PlayerNameStack, PlayerPhoto } from "./PlayerCard";
import { positionLabel } from "@/lib/format";

export function PlayerListItem({ player }: { player: Player }) {
  return (
    <Link href={`/igraci/${player.slug}`} prefetch={false} className="player-list-row group">
      <div className="relative h-24 w-16 shrink-0 overflow-hidden sm:h-28 sm:w-20">
        <PlayerPhoto player={player} size="md" />
      </div>

      <div className="min-w-0 flex-1">
        <PlayerNameStack player={player} size="md" />
        <p className="mt-0.5 text-sm text-white/50">{positionLabel(player.position)}</p>
      </div>

      {player.jerseyNumber != null ? (
        <span className="hidden font-display text-3xl font-bold tabular-nums text-white/15 sm:block sm:text-4xl">
          {player.jerseyNumber}
        </span>
      ) : null}

      <svg
        className="h-5 w-5 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-purple-light"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
