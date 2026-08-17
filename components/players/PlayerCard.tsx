import Image from "next/image";
import Link from "next/link";
import type { Player } from "../../generated/prisma";
import { playerFullName, positionLabel } from "@/lib/format";

export function PlayerPhoto({
  player,
  size = "md",
}: {
  player: Pick<Player, "firstName" | "lastName" | "image" | "jerseyNumber">;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "lg" ? 220 : size === "sm" ? 56 : 160;
  const numberClass = size === "lg" ? "text-6xl" : size === "sm" ? "text-lg" : "text-4xl";

  if (player.image) {
    return (
      <Image
        src={player.image}
        alt={playerFullName(player)}
        width={px}
        height={px}
        className="h-full w-full object-cover"
        unoptimized={player.image.startsWith("http")}
      />
    );
  }

  return (
    <span className="flex h-full w-full items-center justify-center bg-navy">
      <span className={`font-display font-semibold tabular-nums text-gold ${numberClass}`}>
        {player.jerseyNumber ?? "—"}
      </span>
    </span>
  );
}

export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      href={`/igraci/${player.slug}`}
      prefetch={false}
      className="group overflow-hidden rounded-xl border border-navy/15 bg-white shadow-sm transition hover:border-gold hover:shadow-md"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-navy">
        <PlayerPhoto player={player} />
        {player.jerseyNumber != null ? (
          <span className="absolute left-3 top-3 font-display text-3xl font-semibold tabular-nums text-gold drop-shadow">
            {player.jerseyNumber}
          </span>
        ) : null}
      </div>
      <div className="px-4 py-3">
        <p className="font-display text-lg leading-tight text-navy group-hover:text-gold-dark">
          {playerFullName(player)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {positionLabel(player.position)}
          {player.birthYear ? ` · ${player.birthYear}` : ""}
        </p>
      </div>
    </Link>
  );
}
