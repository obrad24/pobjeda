import type { Metadata } from "next";
import Link from "next/link";
import { PlayerPhoto } from "@/components/players/PlayerCard";
import { Container } from "@/components/ui/Section";
import {
  formatShortDate,
  isHomeGame,
  opponentOf,
  playerFullName,
  positionLabel,
  roundLabel,
  seasonLabel,
} from "@/lib/format";
import { orNotFound } from "@/lib/not-found";
import { getPlayerBySlug } from "@/lib/players";
import { getOurTeam } from "@/lib/context";
import { getPlayerAppearances, getPlayerStatistics } from "@/lib/stats";
import { FantasyBreakdownList } from "@/components/fantasy/FantasyBreakdownList";
import { FantasyFormChart } from "@/components/fantasy/FantasyFormChart";
import { getPlayerFantasyProfile } from "@/lib/fantasy";

export const revalidate = 120;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const player = await getPlayerBySlug(slug);
    return {
      title: playerFullName(player),
      description: `${playerFullName(player)}, ${positionLabel(player.position)}${
        player.jerseyNumber != null ? `, broj ${player.jerseyNumber}` : ""
      } — FK Pobjeda Triješnica.`,
      openGraph: {
        title: playerFullName(player),
        type: "profile",
      },
    };
  } catch (error) {
    orNotFound(error);
  }
}

export default async function PlayerProfilePage({ params }: Props) {
  const { slug } = await params;
  let player;
  try {
    player = await getPlayerBySlug(slug);
  } catch (error) {
    orNotFound(error);
  }

  const [stats, appearances, ourTeam, fantasy] = await Promise.all([
    getPlayerStatistics(player.id),
    getPlayerAppearances(player.id),
    getOurTeam(),
    getPlayerFantasyProfile(player.id),
  ]);

  return (
    <Container className="py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
          <div className="aspect-[4/5] bg-navy">
            <PlayerPhoto player={player} size="lg" />
          </div>
          <div className="p-5">
            {player.jerseyNumber != null ? (
              <p className="font-display text-4xl text-gold">{player.jerseyNumber}</p>
            ) : null}
            <h1 className="font-display text-3xl text-navy">{playerFullName(player)}</h1>
            <p className="mt-1 text-muted">
              {positionLabel(player.position)}
              {player.birthYear ? ` · ${player.birthYear}` : ""}
            </p>
            {player.formerClubs ? (
              <p className="mt-4 text-sm leading-6 text-navy/80">
                <span className="block text-xs uppercase tracking-wide text-muted">Bivši klubovi</span>
                {player.formerClubs}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="mb-4 font-display text-2xl text-navy">Sezona</h2>
            {stats.hasData ? (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatBox label="Nastupi" value={stats.appearances} />
                <StatBox label="Minute" value={stats.minutes} />
                <StatBox label="Golovi" value={stats.goals} />
                <StatBox label="Asistencije" value={stats.assists} />
                <StatBox label="Žuti" value={stats.yellowCards} />
                <StatBox label="Crveni" value={stats.redCards} />
              </dl>
            ) : (
              <p className="rounded-xl border border-navy/10 bg-white px-4 py-6 text-sm text-muted">
                Statistika će biti dostupna nakon prvih utakmica.
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-display text-2xl text-navy">Fantasy</h2>
            {fantasy.appearances === 0 ? (
              <p className="rounded-xl border border-navy/10 bg-white px-4 py-6 text-sm text-muted">
                Fantasy bodovi će biti dostupni nakon prvog nastupa u sezoni {seasonLabel(fantasy.season.name)}.
              </p>
            ) : (
              <div className="space-y-6">
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatBox label="Ukupno bodova" value={fantasy.total} />
                  <StatBox label="Prosjek" value={fantasy.average.toFixed(1)} />
                  <StatBox label="Bodovi u posljednjem kolu" value={fantasy.lastGameweekPoints ?? 0} />
                  <StatBox label="Fantasy rang" value={fantasy.rank != null ? `${fantasy.rank}.` : "—"} />
                </dl>
                <div className="rounded-xl border border-navy/10 bg-white p-4">
                  <p className="mb-3 text-xs uppercase tracking-wide text-muted">Bodovi po kolima</p>
                  <FantasyFormChart
                    values={fantasy.history.map((row) => row.points)}
                    labels={fantasy.history.map((row) => (row.round > 0 ? String(row.round) : "P"))}
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-navy/10 bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-navy text-left text-white">
                      <tr>
                        <th className="px-4 py-3 font-medium">Kolo</th>
                        <th className="px-4 py-3 font-medium">Protivnik</th>
                        <th className="px-4 py-3 font-medium">Bodovi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fantasy.history.map((row) => (
                        <tr key={row.matchId} className="border-t border-navy/10 align-top">
                          <td className="px-4 py-3 tabular-nums">{roundLabel(row.round)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/utakmice/${row.matchId}`} className="text-navy hover:text-gold-dark">
                              {row.home ? "vs" : "@"} {row.opponentSlugName}
                            </Link>
                            <details className="mt-2 max-w-xs">
                              <summary className="cursor-pointer text-xs text-muted">Breakdown</summary>
                              <div className="mt-2">
                                <FantasyBreakdownList breakdown={row.breakdown} />
                              </div>
                            </details>
                          </td>
                          <td className="px-4 py-3 font-display text-xl tabular-nums text-gold">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-display text-2xl text-navy">Nastupi</h2>
            {appearances.length === 0 ? (
              <p className="rounded-xl border border-navy/10 bg-white px-4 py-6 text-sm text-muted">
                Još nema unesenih nastupa za ovog igrača.
              </p>
            ) : (
              <ul className="divide-y divide-navy/10 overflow-hidden rounded-xl border border-navy/10 bg-white">
                {appearances.map((row) => {
                  const opponent = opponentOf(row.match, ourTeam.id);
                  const home = isHomeGame(row.match, ourTeam.id);
                  const goals = row.match.goals.filter((goal) => goal.playerId === player.id && !goal.ownGoal).length;
                  const assists = row.match.goals.filter(
                    (goal) => goal.assistPlayerId === player.id && !goal.ownGoal,
                  ).length;
                  return (
                    <li key={row.id}>
                      <Link
                        href={`/utakmice/${row.match.id}`}
                        className="flex flex-col gap-2 px-4 py-3 hover:bg-cream sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-navy">
                            {home ? "vs" : "@"} {opponent.sportdcName}
                          </p>
                          <p className="text-xs text-muted">
                            {roundLabel(row.match.round)} · {formatShortDate(row.match.date)} ·{" "}
                            {row.starter ? "starter" : "izmjena"}
                          </p>
                        </div>
                        <p className="text-sm tabular-nums text-muted">
                          {row.minutes ?? 0} min
                          {goals ? ` · ${goals} gol` : ""}
                          {assists ? ` · ${assists} as.` : ""}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Container>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white px-4 py-4">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-display text-3xl text-navy">{value}</dd>
    </div>
  );
}
