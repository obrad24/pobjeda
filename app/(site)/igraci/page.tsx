import type { Metadata } from "next";
import { PlayerCard } from "@/components/players/PlayerCard";
import { Container, PageHeader } from "@/components/ui/Section";
import { POSITION_ORDER, positionLabel } from "@/lib/format";
import { getCachedPlayers } from "@/lib/site-data";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Igrači",
  description: "Sastav FK Pobjeda Triješnica — igrači, brojevi i pozicije.",
};

export default async function PlayersPage() {
  const players = await getCachedPlayers();

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        eyebrow="Sastav"
        title="Igrači"
        description="Aktivni igrači FK Pobjeda Triješnica. Kliknite karticu za profil i sezonsku statistiku."
      />
      <div className="space-y-12">
        {POSITION_ORDER.map((position) => {
          const group = players.filter((player) => player.position === position);
          if (group.length === 0) {
            return null;
          }
          return (
            <section key={position}>
              <h2 className="mb-4 font-display text-xl text-navy">{positionLabel(position)}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {group.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Container>
  );
}
