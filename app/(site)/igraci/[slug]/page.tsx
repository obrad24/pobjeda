import type { Metadata } from "next";
import Link from "next/link";
import { PlayerPosterHero } from "@/components/players/PlayerPosterHero";
import { PlayerProfileTabs } from "@/components/players/PlayerProfileTabs";
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
import { getPlayerBySlug, parseFormerClubs } from "@/lib/players";
import { getOurTeam } from "@/lib/context";
import { getUpcomingMatches } from "@/lib/matches";
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

  const [stats, appearances, ourTeam, fantasy, upcoming] = await Promise.all([
    getPlayerStatistics(player.id),
    getPlayerAppearances(player.id),
    getOurTeam(),
    getPlayerFantasyProfile(player.id),
    getUpcomingMatches({ limit: 1 }),
  ]);

  const formerClubs = parseFormerClubs(player.formerClubs);

  const overviewTab = (
    <div className="space-y-8">
      {/* Season stats */}
      <section>
        <h2 className="mb-4 font-display text-xl text-white">Sezona</h2>
        {stats.hasData ? (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatBox label="Nastupi" value={stats.appearances} />
            <StatBox label="Minute" value={stats.minutes} />
            <StatBox label="Golovi" value={stats.goals} />
            <StatBox label="Asistencije" value={stats.assists} />
            <StatBox label="Žuti" value={stats.yellowCards} />
            <StatBox label="Crveni" value={stats.redCards} />
          </dl>
        ) : (
          <p className="glass-card rounded-2xl px-4 py-6 text-sm text-white/50">
            Statistika će biti dostupna nakon prvih utakmica.
          </p>
        )}
      </section>

      {/* Former clubs */}
      {formerClubs.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl text-white">Bivši klubovi</h2>
          <div className="flex flex-wrap gap-2">
            {formerClubs.map((club) => (
              <span key={club} className="glass-pill px-4 py-1.5 text-sm text-white/70">
                {club}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const fantasyTab = (
    <div>
      {fantasy.appearances === 0 ? (
        <p className="glass-card rounded-2xl px-4 py-6 text-sm text-white/50">
          Fantasy bodovi će biti dostupni nakon prvog nastupa u sezoni {seasonLabel(fantasy.season.name)}.
        </p>
      ) : (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Ukupno bodova" value={fantasy.total} />
            <StatBox label="Prosjek" value={fantasy.average.toFixed(1)} />
            <StatBox label="Posljednje kolo" value={fantasy.lastGameweekPoints ?? 0} />
            <StatBox label="Fantasy rang" value={fantasy.rank != null ? `${fantasy.rank}.` : "—"} />
          </dl>
          <div className="glass-card rounded-2xl p-4">
            <p className="mb-3 text-xs uppercase tracking-wide text-white/50">Bodovi po kolima</p>
            <FantasyFormChart
              values={fantasy.history.map((row) => row.points)}
              labels={fantasy.history.map((row) => (row.round > 0 ? String(row.round) : "P"))}
            />
          </div>
          <div className="glass-card overflow-hidden rounded-2xl">
            <table className="w-full text-sm text-white/80">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/60">
                  <th className="px-4 py-3 font-medium">Kolo</th>
                  <th className="px-4 py-3 font-medium">Protivnik</th>
                  <th className="px-4 py-3 font-medium">Bodovi</th>
                </tr>
              </thead>
              <tbody>
                {fantasy.history.map((row) => (
                  <tr key={row.matchId} className="border-t border-white/5 align-top">
                    <td className="px-4 py-3 tabular-nums">{roundLabel(row.round)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/utakmice/${row.matchId}`} className="text-white hover:text-purple-light">
                        {row.home ? "vs" : "@"} {row.opponentSlugName}
                      </Link>
                      <details className="mt-2 max-w-xs">
                        <summary className="cursor-pointer text-xs text-white/50">Breakdown</summary>
                        <div className="mt-2">
                          <FantasyBreakdownList breakdown={row.breakdown} />
                        </div>
                      </details>
                    </td>
                    <td className="px-4 py-3 font-display text-xl tabular-nums text-purple-light">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const appearancesTab = (
    <div>
      {appearances.length === 0 ? (
        <p className="glass-card rounded-2xl px-4 py-6 text-sm text-white/50">
          Još nema unesenih nastupa za ovog igrača.
        </p>
      ) : (
        <ul className="glass-card divide-y divide-white/5 overflow-hidden rounded-2xl">
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
                  className="flex flex-col gap-2 px-4 py-3 transition hover:bg-purple/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">
                      {home ? "vs" : "@"} {opponent.sportdcName}
                    </p>
                    <p className="text-xs text-white/50">
                      {roundLabel(row.match.round)} · {formatShortDate(row.match.date)} ·{" "}
                      {row.starter ? "starter" : "izmjena"}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums text-white/50">
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
    </div>
  );

  return (
    <div>
      <PlayerPosterHero player={player} stats={stats} nextMatch={upcoming[0] ?? null} />

      {/* Content tabs */}
      <Container className="py-8 sm:py-12">
        <PlayerProfileTabs
          tabs={[
            { id: "overview", label: "Pregled", content: overviewTab },
            { id: "fantasy", label: "Fantasy", content: fantasyTab },
            { id: "appearances", label: "Nastupi", content: appearancesTab },
          ]}
        />
      </Container>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass-card rounded-2xl px-4 py-4">
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="mt-1 font-display text-3xl text-white">{value}</dd>
    </div>
  );
}
