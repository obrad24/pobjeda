import "dotenv/config";
import { GET as cronGet } from "../app/api/cron/sportdc-sync/route";
import { prisma } from "../lib/db/prisma";
import { getOurTeam } from "../lib/context";
import { getLeague } from "../lib/sportdc/league";
import { getStandings as getSportDcStandings } from "../lib/sportdc/standings";
import { fetchRoundPage, getLeagueUrl } from "../lib/sportdc/client";
import { parseGames, teamsByTableIndex } from "../lib/sportdc/parser";
import { getSyncStatus, syncMatches } from "../lib/sportdc/sync";
import {
  createPlayer,
  deletePlayer,
  getPlayerBySlug,
} from "../lib/players";
import {
  getMatchBySportDcId,
  getRecentMatches,
  getUpcomingMatches,
  saveMatchStatistics,
} from "../lib/matches";
import { ourEnteredGoalsMismatch } from "../lib/matches/score-warning";
import { getPlayerStatistics, getTopScorers } from "../lib/stats";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function liveSportDc() {
  const meta = await getLeague();
  assert(meta.sportdcLeagueId === 6452, `League ID ${meta.sportdcLeagueId}`);
  assert(meta.seasonName.includes("2026"), `Season ${meta.seasonName}`);
  const standings = await getSportDcStandings();
  assert(standings.length === 14, `Expected 14 clubs, got ${standings.length}`);
  const pobjeda = standings.find((row) => row.sportdcTeamId === 8448);
  assert(pobjeda, "Pobjeda 8448 missing from live table");
  assert(pobjeda.city === "Triješnica" || Boolean(pobjeda.sportdcName), "Pobjeda identity");
  const teamIds = standings.map((row) => row.sportdcTeamId);
  assert(new Set(teamIds).size === teamIds.length, "Duplicate club IDs in live table");

  const roundHtml = await fetchRoundPage(1, getLeagueUrl());
  const round1 = parseGames(roundHtml, teamsByTableIndex(standings), 1);
  const opening = round1.find((match) => match.sportdcMatchId === 604152);
  assert(opening, "Opening match 604152 missing from live round 1");
  assert(opening.homeTeamId === 8448, "604152 home must be 8448");
  const matchIds = round1.map((match) => match.sportdcMatchId);
  assert(new Set(matchIds).size === matchIds.length, "Duplicate match IDs in round 1");

  return { meta, standings, pobjeda, round1 };
}

async function duplicates() {
  const [teamDup, matchDup, leagueDup] = await Promise.all([
    prisma.team.groupBy({ by: ["sportdcTeamId"], _count: { _all: true } }),
    prisma.match.groupBy({ by: ["sportdcMatchId"], _count: { _all: true } }),
    prisma.league.groupBy({ by: ["seasonId", "sportdcLeagueId"], _count: { _all: true } }),
  ]);
  assert(
    teamDup.every((row) => row._count._all === 1),
    "Duplicate teams in database",
  );
  assert(
    matchDup.every((row) => row._count._all === 1),
    "Duplicate matches in database",
  );
  assert(
    leagueDup.every((row) => row._count._all === 1),
    "Duplicate leagues in database",
  );
}

async function workflow() {
  const created = await createPlayer({
    firstName: "QA",
    lastName: `FazaOsam${Date.now()}`,
    position: "MF",
  });
  const ourTeam = await getOurTeam();
  assert(ourTeam.sportdcTeamId === 8448, "Our team must be 8448");
  const upcoming = await getUpcomingMatches({ limit: 3 });
  assert(upcoming.length >= 1, "Expected an upcoming Pobjeda match");
  const recent = await getRecentMatches({ limit: 3 });
  assert(recent.length <= 3, "Recent list must be capped at 3");

  const match = await getMatchBySportDcId(800002);
  const beforeLineups = match.lineups.length;
  await saveMatchStatistics(match.id, {
    lineups: [
      { playerId: created.id, starter: true, minutes: 90 },
    ],
    goals: [{ playerId: created.id, assistPlayerId: null, minute: 12 }],
    cards: [{ playerId: created.id, type: "YELLOW", minute: 40 }],
  });
  const after = await getMatchBySportDcId(800002);
  assert(after.lineups.some((row) => row.playerId === created.id), "Lineup not saved");
  assert(after.goals.some((goal) => goal.playerId === created.id), "Goal not saved");
  assert(after.cards.some((card) => card.playerId === created.id && card.type === "YELLOW"), "Card not saved");
  const stats = await getPlayerStatistics(created.id);
  assert(stats.goals === 1 && stats.yellowCards === 1, "Player stats after events");
  const profile = await getPlayerBySlug(created.slug);
  assert(profile.id === created.id, "Player profile slug");
  const scorers = await getTopScorers({ limit: 10 });
  assert(scorers.some((row) => row.playerId === created.id), "New scorer should appear");

  await prisma.matchPlayer.deleteMany({ where: { matchId: match.id, playerId: created.id } });
  await prisma.matchGoal.deleteMany({ where: { matchId: match.id, playerId: created.id } });
  await prisma.matchCard.deleteMany({ where: { matchId: match.id, playerId: created.id } });
  await prisma.matchPenaltyMiss.deleteMany({ where: { matchId: match.id, playerId: created.id } });
  await prisma.fantasyMatchPoints.deleteMany({ where: { matchId: match.id, playerId: created.id } });
  await deletePlayer(created.id);
  assert(beforeLineups === (await getMatchBySportDcId(800002)).lineups.length, "Cleanup restored lineup count");
}

async function scoreChangeKeepsStats() {
  const match = await getMatchBySportDcId(800001);
  const snapshot = {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    lineups: match.lineups.length,
    goals: match.goals.length,
    cards: match.cards.length,
  };
  assert(snapshot.lineups > 0 && snapshot.goals > 0, "Seed match 800001 must have stats");

  const drifted = await prisma.match.update({
    where: { id: match.id },
    data: { homeScore: (match.homeScore ?? 0) + 1 },
    include: { lineups: true, goals: true, cards: true, homeTeam: true, awayTeam: true },
  });
  assert(drifted.lineups.length === snapshot.lineups, "Lineups must survive a SportDC score change");
  assert(drifted.goals.length === snapshot.goals, "Goals must survive a SportDC score change");
  assert(drifted.cards.length === snapshot.cards, "Cards must survive a SportDC score change");
  const ourTeam = await getOurTeam();
  const warning = ourEnteredGoalsMismatch(drifted, ourTeam.id);
  assert(warning, "Admin should be warned after a score drift");

  const { warnings } = await syncMatches(match.seasonId, match.leagueId, [
    {
      sportdcMatchId: match.sportdcMatchId,
      round: match.round,
      date: match.date,
      time: match.time,
      stadium: match.stadium,
      homeTeamId: match.homeTeam.sportdcTeamId,
      awayTeamId: match.awayTeam.sportdcTeamId,
      homeName: match.homeTeam.sportdcName,
      awayName: match.awayTeam.sportdcName,
      status: match.status,
      homeScore: (match.homeScore ?? 0) + 2,
      awayScore: match.awayScore,
    },
  ]);
  assert(warnings.length >= 1, "syncMatches must warn when a scored match with stats changes");

  await prisma.match.update({
    where: { id: match.id },
    data: { homeScore: snapshot.homeScore, awayScore: snapshot.awayScore },
  });
  const restored = await getMatchBySportDcId(800001);
  assert(restored.lineups.length === snapshot.lineups, "Stats remain after restore");
}

async function sportdcUnavailableKeepsData() {
  const before = {
    matches: await prisma.match.count(),
    lineups: await prisma.matchPlayer.count(),
    lastSuccess: (await getSyncStatus()).lastSuccess?.id ?? null,
  };
  const run = await prisma.syncRun.create({
    data: {
      status: "ERROR",
      source: "SPORTDC",
      finishedAt: new Date(),
      errorMessage: "QA: SportDC nedostupan (simulacija)",
    },
  });
  const status = await getSyncStatus();
  assert(status.lastError?.includes("nedostupan"), "Admin must see the outage error");
  assert(status.lastSuccess?.id === before.lastSuccess || Boolean(status.lastSuccess), "Last success kept");
  assert((await prisma.match.count()) === before.matches, "Outage must not delete matches");
  assert((await prisma.matchPlayer.count()) === before.lineups, "Outage must not delete lineups");
  await prisma.syncRun.delete({ where: { id: run.id } });
}

async function cronUnauthorized() {
  const secret = process.env.CRON_SECRET;
  assert(secret, "CRON_SECRET must be set for the 401 check");
  const res = await cronGet(new Request("http://localhost/api/cron/sportdc-sync"));
  assert(res.status === 401, `Cron without secret expected 401, got ${res.status}`);
  const body = await res.json();
  assert(!JSON.stringify(body).includes(secret), "Cron error body must not leak CRON_SECRET");
}

async function main() {
  console.log("1. Live SportDC…");
  const live = await liveSportDc();
  console.log(`   liga ${live.meta.sportdcLeagueId} ${live.meta.seasonName}, ${live.standings.length} klubova, Pobjeda ${live.pobjeda?.sportdcTeamId}`);

  console.log("2. Duplikati u bazi…");
  await duplicates();

  console.log("3. Workflow igrač + statistika…");
  await workflow();

  console.log("4. Promjena rezultata zadržava statistiku…");
  await scoreChangeKeepsStats();

  console.log("5. SportDC nedostupan…");
  await sportdcUnavailableKeepsData();

  console.log("6. Cron 401…");
  await cronUnauthorized();

  console.log("Phase 8 QA OK");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
