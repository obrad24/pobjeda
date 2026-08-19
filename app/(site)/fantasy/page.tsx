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
    <Container className="py-6 sm:py-8">
      {/* Title row */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Fantasy Pobjeda</h1>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-light">
          {seasonLabel(season.name)}
        </span>
      </div>

      {/* Compact filter bar */}
      <form className="mb-4 flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
        <select
          name="sezona"
          defaultValue={season.id}
          className="rounded-lg border-0 bg-transparent px-2 py-1 text-xs text-white/80 focus:ring-1 focus:ring-purple/50"
        >
          {seasons.map((item) => (
            <option key={item.id} value={item.id} className="bg-[#0f0a2e]">
              {seasonLabel(item.name)}
            </option>
          ))}
        </select>
        <span className="text-white/20">|</span>
        <select
          name="kolo"
          defaultValue={selectedRound == null ? "sve" : String(selectedRound)}
          className="rounded-lg border-0 bg-transparent px-2 py-1 text-xs text-white/80 focus:ring-1 focus:ring-purple/50"
        >
          <option value="sve" className="bg-[#0f0a2e]">Sva kola</option>
          {gameweeks.map((round) => (
            <option key={round} value={round} className="bg-[#0f0a2e]">
              {roundLabel(round)}
            </option>
          ))}
        </select>
        <input type="hidden" name="sort" value={sort} />
        <button type="submit" className="ml-auto rounded-full bg-purple/20 px-4 py-1 text-xs font-semibold text-purple-light transition hover:bg-purple/30">
          Prikaži
        </button>
      </form>

      {leaderboard.length === 0 ? (
        <EmptyState
          title="Fantasy tabela će biti dostupna nakon prvih unesenih sastava"
          body="Bodovi se računaju automatski iz statistike utakmice."
        />
      ) : (
        <div className="space-y-4">
          {/* Compact stats strip */}
          <div className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Ukupno</span>
              <span className="font-display text-lg font-bold tabular-nums text-white">{totalPoints}</span>
            </div>
            <span className="text-white/10">·</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Prosjek</span>
              <span className="font-display text-lg font-bold tabular-nums text-white">{seasonAverage.toFixed(1)}</span>
            </div>
            <span className="text-white/10">·</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Igrača</span>
              <span className="font-display text-lg font-bold tabular-nums text-white">{leaderboard.length}</span>
            </div>
          </div>

          {/* Player of the round + Top 3 side by side */}
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            {playerOfTheRound && <PlayerOfTheRound player={playerOfTheRound} />}
            {leaderboard.length >= 3 && (
              <div className="glass-card overflow-hidden rounded-xl">
                {leaderboard.slice(0, 3).map((row) => (
                  <Link
                    key={row.playerId}
                    href={`/igraci/${row.player.slug}`}
                    className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 transition last:border-0 hover:bg-purple/5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple/15 font-display text-sm font-bold text-purple-light">
                        {row.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{playerFullName(row.player)}</p>
                        <p className="text-[11px] text-white/40">{fantasyPositionLabel(row.position)}</p>
                      </div>
                    </div>
                    <span className="font-display text-xl font-bold tabular-nums text-purple-light">{row.points}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Last round */}
          {lastRound.length > 0 && gameweekRound != null && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-white/60">{roundLabel(gameweekRound)}</h2>
              <div className="glass-card overflow-hidden rounded-xl">
                {lastRound.map((row) => (
                  <Link
                    key={row.playerId}
                    href={`/igraci/${row.player.slug}`}
                    className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-2.5 transition last:border-0 hover:bg-purple/5"
                  >
                    <span className="min-w-0">
                      <span className="text-sm font-medium text-white">{playerFullName(row.player)}</span>
                      <span className="ml-2 text-[11px] text-white/40">{fantasyPositionLabel(row.position)}</span>
                    </span>
                    <span className="font-display text-lg tabular-nums text-purple-light">{row.points}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Leaderboard table */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-white/60">Tabela igrača</h2>
            <FantasyLeaderboard rows={leaderboard} sort={sort} query={query} />
          </section>

          {/* Form chart */}
          {leaderboard[0]?.form.length ? (
            <section className="glass-card rounded-xl p-4">
              <p className="mb-3 text-xs text-white/50">
                {playerFullName(leaderboard[0].player)} — forma
              </p>
              <FantasyFormChart values={leaderboard[0].form} />
            </section>
          ) : null}
        </div>
      )}
    </Container>
  );
}
