import Link from "next/link";
import type { Player } from "../../generated/prisma";
import { PlayerPhoto } from "./PlayerCard";
import { playerFullName, positionLabel } from "@/lib/format";

export function PlayerListItem({ player }: { player: Player }) {
  return (
    <Link href={`/igraci/${player.slug}`} prefetch={false} className="player-list-row group">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-purple/30 bg-navy-dark">
        <PlayerPhoto player={player} size="sm" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg font-semibold text-white group-hover:text-purple-light">
          {playerFullName(player)}
        </p>
        <p className="text-sm text-white/50">
          {positionLabel(player.position)}
          {player.jerseyNumber != null ? ` · #${player.jerseyNumber}` : ""}
        </p>
      </div>

      <svg
        className="h-5 w-5 shrink-0 text-white/30 transition group-hover:text-purple-light group-hover:translate-x-0.5"
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
