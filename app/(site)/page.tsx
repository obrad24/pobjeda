import { HomeStats } from "@/components/home/HomeStats";
import { NextMatch, NextMatchEmpty } from "@/components/home/NextMatch";
import { RecentResults } from "@/components/home/RecentResults";
import { StandingsTable } from "@/components/league/StandingsTable";
import { PlayerCard } from "@/components/players/PlayerCard";
import { Container, EmptyState, SectionHeading } from "@/components/ui/Section";
import { getOurTeam } from "@/lib/context";
import { getStandings } from "@/lib/league";
import { getRecentMatches, getUpcomingMatches } from "@/lib/matches";
import { getPlayers } from "@/lib/players";
import { getTopAppearances, getTopAssists, getTopScorers } from "@/lib/stats";

export const revalidate = 120;

export default async function HomePage() {
  const [ourTeam, upcoming, recent, scorers, assists, appearances, players, standings] = await Promise.all([
    getOurTeam(),
    getUpcomingMatches({ limit: 1 }),
    getRecentMatches({ limit: 3 }),
    getTopScorers({ limit: 5 }),
    getTopAssists({ limit: 5 }),
    getTopAppearances({ limit: 5 }),
    getPlayers(),
    getStandings(),
  ]);

  const nextMatch = upcoming[0];

  return (
    <>
      {nextMatch ? <NextMatch match={nextMatch} /> : <NextMatchEmpty />}

      <Container className="space-y-16 py-12 sm:py-16">
        <section>
          <SectionHeading title="Posljednja 3 meča" href="/rezultati" actionLabel="Svi rezultati" />
          {recent.length === 0 ? (
            <EmptyState
              title="Još nema odigranih utakmica"
              body="Kada sezona krene, ovdje će stajati posljednji rezultati FK Pobjeda."
            />
          ) : (
            <RecentResults matches={recent} ourTeamId={ourTeam.id} />
          )}
        </section>

        <section>
          <SectionHeading title="Statistika igrača" href="/statistika" />
          <HomeStats scorers={scorers} assists={assists} appearances={appearances} />
        </section>

        <section>
          <SectionHeading title="Sastav" href="/igraci" actionLabel="Svi igrači" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title="Tabela lige" href="/liga" actionLabel="Puna tabela" />
          {standings.rows.length === 0 ? (
            <EmptyState title="Tabela nije dostupna" body="Tabela se učitava nakon sinhronizacije sa SportDC-om." />
          ) : (
            <StandingsTable rows={standings.rows} />
          )}
        </section>
      </Container>
    </>
  );
}
