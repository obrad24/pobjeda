import type { Metadata } from "next";
import { FixturesList, RoundFilter } from "@/components/league/FixturesList";
import { Container, PageHeader, SectionHeading } from "@/components/ui/Section";
import { getOurTeam } from "@/lib/context";
import { getCachedSchedule } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Rezultati i raspored",
  description: "Naredne i odigrane utakmice Prve opštinske lige Bijeljina, filter po kolima.",
};

function parseRound(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return undefined;
  }
  const round = Number(raw);
  return Number.isInteger(round) && round > 0 ? round : undefined;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const selected = parseRound(params.kolo);
  const [schedule, ourTeam] = await Promise.all([getCachedSchedule(), getOurTeam()]);
  const rounds = schedule.rounds.map((round) => round.round).filter((round) => round > 0);
  const matches = selected
    ? (schedule.rounds.find((round) => round.round === selected)?.matches ?? [])
    : schedule.matches;

  const upcoming = matches.filter((match) => match.status === "SCHEDULED" || match.status === "POSTPONED");
  const played = matches.filter((match) => match.status === "FINISHED").slice().reverse();

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        eyebrow="Prva opštinska liga Bijeljina"
        title="Rezultati / raspored"
        description="Odvojeno naredne i odigrane utakmice. Filtrirajte po kolu. Utakmice FK Pobjeda su označene zlatnom pozadinom."
      />
      <RoundFilter rounds={rounds} selected={selected} />

      <section className="mb-12">
        <SectionHeading title="Naredne utakmice" />
        <FixturesList
          matches={upcoming}
          ourTeamId={ourTeam.id}
          empty={selected ? `Nema zakazanih utakmica u ${selected}. kolu.` : "Nema zakazanih utakmica."}
        />
      </section>

      <section>
        <SectionHeading title="Odigrane utakmice" />
        <FixturesList
          matches={played}
          ourTeamId={ourTeam.id}
          empty={
            selected
              ? `Još nema odigranih utakmica u ${selected}. kolu.`
              : "Sezona još nije počela — rezultati će se pojaviti nakon prvih kola."
          }
        />
      </section>
    </Container>
  );
}
