import type { Metadata } from "next";
import { FormationBuilder } from "@/components/formation/FormationBuilder";
import { Container } from "@/components/ui/Section";
import { getCachedPlayers } from "@/lib/site-data";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Formacija",
  description: "Izaberi formaciju i sastavi svojih prvih jedanaest igrača FK Pobjeda Triješnica.",
};

export default async function FormationPage() {
  const players = await getCachedPlayers();
  const formationPlayers = players.map((player) => ({
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    image: player.image,
    jerseyNumber: player.jerseyNumber,
    position: player.position,
  }));

  return (
    <Container className="overflow-x-hidden py-4 sm:py-8">
      <div className="mb-3 sm:mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-light">Tvojih prvih 11</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-4xl">Formacija</h1>
        <p className="mt-1 max-w-xl text-sm text-white/50">
          Izaberi sistem igre i postavi igrače na teren.
        </p>
      </div>

      <FormationBuilder players={formationPlayers} />
    </Container>
  );
}
