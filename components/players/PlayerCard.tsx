import Image from "next/image";
import Link from "next/link";
import type { Player } from "../../generated/prisma";
import { playerFullName, positionLabel } from "@/lib/format";

export function PlayerNameStack({
  player,
  size = "md",
  className = "",
}: {
  player: Pick<Player, "firstName" | "lastName">;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const first =
    size === "lg"
      ? "text-sm font-medium tracking-[0.18em] text-white/80 sm:text-lg"
      : size === "sm"
        ? "text-[10px] font-medium tracking-wide text-white/75"
        : size === "xs"
          ? "text-[8px] font-medium leading-none tracking-wide text-white/80"
          : "text-xs font-medium tracking-wide text-white/80";
  const last =
    size === "lg"
      ? "mt-0.5 font-display text-4xl font-bold leading-[0.9] text-white sm:text-6xl lg:text-7xl"
      : size === "sm"
        ? "font-display text-base font-bold leading-tight text-white"
        : size === "xs"
          ? "font-display text-[11px] font-bold leading-tight text-white sm:text-sm"
          : "font-display text-xl font-bold leading-tight text-white sm:text-2xl";

  return (
    <span className={`block ${className}`}>
      <span className={`block ${first}`}>{player.firstName}</span>
      <span className={`block ${last}`}>{player.lastName}</span>
    </span>
  );
}

export function PlayerPhoto({
  player,
  size = "md",
  className = "",
  priority = false,
}: {
  player: Pick<Player, "firstName" | "lastName" | "image" | "jerseyNumber">;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
}) {
  const px = size === "lg" ? 720 : size === "sm" ? 56 : 320;
  const numberClass = size === "lg" ? "text-6xl" : size === "sm" ? "text-lg" : "text-4xl";

  if (player.image) {
    return (
      <Image
        src={player.image}
        alt={playerFullName(player)}
        width={px}
        height={px}
        priority={priority}
        className={`h-full w-full object-contain object-bottom ${className}`}
        unoptimized={player.image.startsWith("http")}
      />
    );
  }

  return (
    <span className="flex h-full w-full items-center justify-center bg-white/5">
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
      className="glass-card group overflow-hidden rounded-2xl transition"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-navy-dark">
        <PlayerPhoto player={player} />
        {player.jerseyNumber != null ? (
          <span className="absolute left-3 top-3 font-display text-3xl font-semibold tabular-nums text-white/25 drop-shadow">
            {player.jerseyNumber}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy-dark via-navy-dark/70 to-transparent px-3 pb-3 pt-16">
          <PlayerNameStack player={player} size="md" />
          <p className="mt-1 text-xs text-white/55">
            {positionLabel(player.position)}
            {player.birthYear ? ` · ${player.birthYear}` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
