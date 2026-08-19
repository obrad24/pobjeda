import { HomeStats } from "@/components/home/HomeStats";
import { NextMatch, NextMatchEmpty } from "@/components/home/NextMatch";
import { RecentResults } from "@/components/home/RecentResults";
import { StandingsTable } from "@/components/league/StandingsTable";
import { PlayerNameStack, PlayerPhoto } from "@/components/players/PlayerCard";
import { Container, EmptyState, SectionHeading } from "@/components/ui/Section";
import { getOurTeam } from "@/lib/context";
import { getRecentMatches, getUpcomingMatches } from "@/lib/matches";
import { getCachedPlayers, getCachedStandings } from "@/lib/site-data";
import { getTopAppearances, getTopAssists, getTopScorers } from "@/lib/stats";
import Link from "next/link";
import { positionLabel } from "@/lib/format";

export const revalidate = 120;

export default async function HomePage() {
  const [ourTeam, upcoming, recent, scorers, assists, appearances, players, standings] = await Promise.all([
    getOurTeam(),
    getUpcomingMatches({ limit: 1 }),
    getRecentMatches({ limit: 3 }),
    getTopScorers({ limit: 5 }),
    getTopAssists({ limit: 5 }),
    getTopAppearances({ limit: 5 }),
    getCachedPlayers(),
    getCachedStandings(),
  ]);

  const nextMatch = upcoming[0];

  return (
    <>
      {nextMatch ? <NextMatch match={nextMatch} /> : <NextMatchEmpty />}

      <Container className="space-y-8 py-7 sm:space-y-10 sm:py-10">
        <section className="[&>div:first-child]:mb-3">
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

        <section className="[&>div:first-child]:mb-3">
          <SectionHeading title="Statistika igrača" href="/statistika" />
          <HomeStats scorers={scorers} assists={assists} appearances={appearances} />
        </section>

        <section className="[&>div:first-child]:mb-3">
          <SectionHeading title="Sastav" href="/igraci" actionLabel="Svi igrači" />
          {players.length === 0 ? (
            <EmptyState
              title="Sastav se još unosi"
              body="Kartice igrača će stajati ovdje nakon što ih klub doda u adminu."
            />
          ) : (
            <div className="-mx-4 sm:-mx-6">
              <div className="flex gap-3 overflow-x-auto px-4 pb-1 sm:px-6">
                {players.slice(0, 10).map((player) => (
                  <Link
                    key={player.id}
                    href={`/igraci/${player.slug}`}
                    prefetch={false}
                    className="glass-card group w-36 shrink-0 overflow-hidden rounded-2xl sm:w-40"
                  >
                    <div className="relative aspect-3/4 overflow-hidden bg-navy-dark">
                      <PlayerPhoto player={player} />
                      {player.jerseyNumber != null && (
                        <span className="absolute right-2 top-2 font-display text-lg font-bold tabular-nums text-white/25">
                          {player.jerseyNumber}
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-navy-dark via-navy-dark/75 to-transparent px-2.5 pb-2.5 pt-12">
                        <PlayerNameStack player={player} size="sm" />
                        <p className="mt-0.5 text-[11px] text-white/45">{positionLabel(player.position)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="[&>div:first-child]:mb-3">
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
