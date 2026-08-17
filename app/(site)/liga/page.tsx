import type { Metadata } from "next";
import { FixturesList } from "@/components/league/FixturesList";
import { StandingsTable } from "@/components/league/StandingsTable";
import { Container, EmptyState, PageHeader, SectionHeading } from "@/components/ui/Section";
import { getOurTeam, resolveLeague } from "@/lib/context";
import { getSchedule, getStandings } from "@/lib/league";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Liga",
  description: "Tabela Prve opštinske lige Bijeljina i raspored FK Pobjeda Triješnica.",
};

export default async function LeaguePage() {
  const [league, standings, schedule, ourTeam] = await Promise.all([
    resolveLeague(),
    getStandings(),
    getSchedule(),
    getOurTeam(),
  ]);

  const upcoming = schedule.matches
    .filter((match) => match.status === "SCHEDULED" || match.status === "POSTPONED")
    .slice(0, 7);

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader eyebrow={league.season.name} title={league.name} description="Podaci tabele dolaze iz Neon baze, sinhronizovane sa SportDC-om." />

      <section className="mb-12">
        <SectionHeading title="Tabela" />
        {standings.rows.length === 0 ? (
          <EmptyState title="Tabela nije dostupna" body="Sinhronizacija lige još nije učitala poredak." />
        ) : (
          <StandingsTable rows={standings.rows} />
        )}
      </section>

      <section>
        <SectionHeading title="Naredne utakmice" href="/rezultati" actionLabel="Raspored" />
        <FixturesList
          matches={upcoming}
          ourTeamId={ourTeam.id}
          empty="Nema zakazanih ligaških utakmica."
        />
      </section>
    </Container>
  );
}
