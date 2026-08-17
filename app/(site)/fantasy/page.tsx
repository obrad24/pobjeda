import type { Metadata } from "next";
import Link from "next/link";
import { FantasyFormChart } from "@/components/fantasy/FantasyFormChart";
import { FantasyLeaderboard } from "@/components/fantasy/FantasyLeaderboard";
import { PlayerOfTheRound } from "@/components/fantasy/PlayerOfTheRound";
import { Container, EmptyState } from "@/components/ui/Section";
import {
  FANTASY_SORTS,
  getFantasyGameweekLeaderboard,
  getFantasyGameweeks,
  getFantasyLeaderboard,
  getFantasySeasons,
  getLatestFantasyGameweek,
  type FantasySort,
} from "@/lib/fantasy";
import { fantasyPositionLabel } from "@/lib/fantasy";
import { playerFullName, roundLabel, seasonLabel } from "@/lib/format";
import { resolveSeason } from "@/lib/context";

export const metadata: Metadata = {
  title: "Fantasy Pobjeda",
  description: "Prati učinak igrača FK Pobjeda Triješnica i osvajaj bodove zajedno sa svojim omiljenim igračima.",
};

function parseSort(value: string | string[] | undefined): FantasySort {
  const raw = Array.isArray(value) ? value[0] : value;
  return FANTASY_SORTS.includes(raw as FantasySort) ? (raw as FantasySort) : "points";
}

function parseRound(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === "sve") {
    return undefined;
  }
  const round = Number(raw);
  return Number.isInteger(round) && round >= 0 ? round : undefined;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FantasyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const seasons = await getFantasySeasons();
  const season = await resolveSeason(firstParam(params.sezona));
  const sort = parseSort(params.sort);
  const selectedRound = parseRound(params.kolo);
  const [leaderboard, gameweeks, latestRound] = await Promise.all([
    getFantasyLeaderboard({ seasonId: season.id, round: selectedRound, sort }),
    getFantasyGameweeks(season.id),
    getLatestFantasyGameweek(season.id),
  ]);

  const gameweekRound = selectedRound ?? latestRound;
  const lastRound =
    gameweekRound == null
      ? []
      : await getFantasyGameweekLeaderboard({ seasonId: season.id, round: gameweekRound });
  const playerOfTheRound = lastRound[0] ?? null;
  const query: Record<string, string> = { sezona: season.id };
  if (selectedRound != null) {
    query.kolo = String(selectedRound);
  }
  query.sort = sort;

  const totalPoints = leaderboard.reduce((sum, row) => sum + row.points, 0);
  const totalAppearances = leaderboard.reduce((sum, row) => sum + row.appearances, 0);
  const seasonAverage = totalAppearances > 0 ? Math.round((totalPoints / totalAppearances) * 10) / 10 : 0;

  return (
    <div>
      <section className="hero-panel">
        <Container className="py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Fantasy Pobjeda</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl text-white sm:text-5xl">FANTASY POBJEDA</h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Prati učinak igrača i osvajaj bodove zajedno sa svojim omiljenim igračima.
          </p>
          <p className="mt-6 text-sm text-gold">Sezona {seasonLabel(season.name)}</p>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <form className="mb-8 flex flex-col gap-3 rounded-xl border border-navy/10 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Sezona</span>
            <select name="sezona" defaultValue={season.id} className="rounded border border-navy/20 px-3 py-2 text-sm">
              {seasons.map((item) => (
                <option key={item.id} value={item.id}>
                  {seasonLabel(item.name)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wide text-muted">Kolo</span>
            <select name="kolo" defaultValue={selectedRound == null ? "sve" : String(selectedRound)} className="rounded border border-navy/20 px-3 py-2 text-sm">
              <option value="sve">Sva kola</option>
              {gameweeks.map((round) => (
                <option key={round} value={round}>
                  {roundLabel(round)}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="sort" value={sort} />
          <button type="submit" className="rounded-full bg-navy px-5 py-2 text-sm text-gold">
            Prikaži
          </button>
        </form>

        {leaderboard.length === 0 ? (
          <EmptyState
            title="Fantasy tabela će biti dostupna nakon prvih unesenih sastava"
            body="Bodovi se računaju automatski iz statistike utakmice. Admin ne unosi fantasy broj ručno."
          />
        ) : (
          <div className="space-y-10">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Sezona" value={seasonLabel(season.name)} />
              <StatTile label="Ukupni bodovi" value={String(totalPoints)} />
              <StatTile label="Prosjek po utakmici" value={seasonAverage.toFixed(1)} />
            </div>

            {playerOfTheRound ? <PlayerOfTheRound player={playerOfTheRound} /> : null}

            <section>
              <h2 className="mb-4 font-display text-2xl text-navy">Najbolji igrači</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {leaderboard.slice(0, 3).map((row) => (
                  <Link
                    key={row.playerId}
                    href={`/igraci/${row.player.slug}`}
                    className="rounded-xl border border-navy/10 bg-white p-4 hover:border-gold"
                  >
                    <p className="text-xs uppercase tracking-wide text-gold">{row.rank}. mjesto</p>
                    <p className="mt-1 font-display text-xl text-navy">{playerFullName(row.player)}</p>
                    <p className="text-sm text-muted">{fantasyPositionLabel(row.position)}</p>
                    <p className="mt-3 font-display text-3xl tabular-nums text-gold">{row.points}</p>
                  </Link>
                ))}
              </div>
            </section>

            {lastRound.length > 0 && gameweekRound != null ? (
              <section>
                <h2 className="mb-4 font-display text-2xl text-navy">Posljednje kolo · {roundLabel(gameweekRound)}</h2>
                <ul className="divide-y divide-navy/10 overflow-hidden rounded-xl border border-navy/10 bg-white">
                  {lastRound.map((row) => (
                    <li key={row.playerId}>
                      <Link
                        href={`/igraci/${row.player.slug}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-cream"
                      >
                        <span>
                          <span className="font-medium text-navy">{playerFullName(row.player)}</span>
                          <span className="ml-2 text-xs text-muted">{fantasyPositionLabel(row.position)}</span>
                        </span>
                        <span className="font-display text-xl tabular-nums text-gold">{row.points}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h2 className="mb-4 font-display text-2xl text-navy">Fantasy tabela igrača</h2>
              <FantasyLeaderboard rows={leaderboard} sort={sort} query={query} />
            </section>

            {leaderboard[0]?.form.length ? (
              <section>
                <h2 className="mb-4 font-display text-2xl text-navy">Forma vodećeg</h2>
                <div className="rounded-xl border border-navy/10 bg-white p-5">
                  <p className="mb-4 text-sm text-muted">{playerFullName(leaderboard[0].player)} — posljednja kola</p>
                  <FantasyFormChart values={leaderboard[0].form} />
                </div>
              </section>
            ) : null}
          </div>
        )}
      </Container>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-navy">{value}</p>
    </div>
  );
}
