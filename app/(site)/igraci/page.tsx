import type { Metadata } from "next";
import { Suspense } from "react";
import { PlayerListItem } from "@/components/players/PlayerListItem";
import { PositionFilter } from "@/components/players/PositionFilter";
import { Container, EmptyState } from "@/components/ui/Section";
import { getCachedPlayers } from "@/lib/site-data";
import type { Position } from "../../../generated/prisma";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Igrači",
  description: "Sastav FK Pobjeda Triješnica — igrači, brojevi i pozicije.",
};

type Props = {
  searchParams: Promise<{ pos?: string }>;
};

export default async function PlayersPage({ searchParams }: Props) {
  const { pos } = await searchParams;
  const allPlayers = await getCachedPlayers();

  const validPositions = new Set(["GK", "DF", "MF", "FW"]);
  const filtered =
    pos && validPositions.has(pos)
      ? allPlayers.filter((p) =>
          pos === "FW" ? p.position === "FW" || p.position === "WG" : p.position === (pos as Position),
        )
      : allPlayers;

  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-purple-light">
          Sastav
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-wide text-white sm:text-4xl">
          Igrači
        </h1>
      </div>

      <div className="mb-6">
        <Suspense>
          <PositionFilter />
        </Suspense>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nema igrača"
          body="Nema igrača za odabranu poziciju."
        />
      ) : (
        <div className="glass-card overflow-hidden rounded-2xl">
          {filtered.map((player) => (
            <PlayerListItem key={player.id} player={player} />
          ))}
        </div>
      )}
    </Container>
  );
}
