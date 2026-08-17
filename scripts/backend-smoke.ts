import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { ValidationError } from "../lib/errors";
import { createHistoryEntry, deleteHistoryEntry } from "../lib/history";
import { getResults, getSchedule, getStandings } from "../lib/league";
import {
  getMatch,
  getMatchBySportDcId,
  getMatchesByRound,
  getRecentMatches,
  getUpcomingMatches,
  saveMatchStatistics,
} from "../lib/matches";
import {
  createPlayer,
  deactivatePlayer,
  deletePlayer,
  getPlayers,
  updatePlayer,
} from "../lib/players";
import { getSyncStatus } from "../lib/sportdc/sync";
import {
  getPlayerStatistics,
  getTeamStatistics,
  getTopAppearances,
  getTopAssists,
  getTopScorers,
} from "../lib/stats";

const FIXTURE_MATCH_ID = 899001;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function cleanupFixtureMatch() {
  await prisma.match.deleteMany({ where: { sportdcMatchId: FIXTURE_MATCH_ID } });
}

async function createFixtureMatch() {
  await cleanupFixtureMatch();
  const opening = await prisma.match.findUnique({ where: { sportdcMatchId: 604152 } });
  const pobjeda = await prisma.team.findUnique({ where: { sportdcTeamId: 8448 } });
  const tavna = await prisma.team.findUnique({ where: { sportdcTeamId: 7594 } });
  assert(opening && pobjeda && tavna, "Fixture match needs opening match and clubs");

  return prisma.match.create({
    data: {
      seasonId: opening.seasonId,
      leagueId: opening.leagueId,
      homeTeamId: pobjeda.id,
      awayTeamId: tavna.id,
      sportdcMatchId: FIXTURE_MATCH_ID,
      date: new Date("2026-08-10T17:00:00+02:00"),
      time: "17:00",
      stadium: "Triješnica",
      round: 0,
      status: "FINISHED",
      homeScore: 2,
      awayScore: 1,
    },
  });
}

async function main() {
  const leftover = await prisma.match.findUnique({ where: { sportdcMatchId: 800002 } });
  if (leftover) {
    await prisma.matchPlayer.deleteMany({ where: { matchId: leftover.id } });
    await prisma.matchGoal.deleteMany({ where: { matchId: leftover.id } });
    await prisma.matchCard.deleteMany({ where: { matchId: leftover.id } });
  }

  const players = await getPlayers();
  assert(
    players.every((player) => player.active),
    "getPlayers must hide inactive players by default",
  );

  const upcoming = await getUpcomingMatches({ limit: 10 });
  assert(upcoming.length >= 1, "Expected at least one upcoming Pobjeda match");
  assert(
    upcoming.some((match) => match.sportdcMatchId === 604152),
    "Opening match 604152 must be in upcoming matches",
  );
  assert(
    upcoming[0].sportdcMatchId === 604152,
    `Next match should be 604152, got ${upcoming[0].sportdcMatchId}`,
  );

  const recent = await getRecentMatches({ limit: 3 });
  assert(
    recent.every((match) => match.status === "FINISHED"),
    "Recent matches must be finished",
  );

  const round1 = await getMatchesByRound(1);
  assert(round1.length === 7, `Round 1 must have 7 matches, got ${round1.length}`);

  const opening = await getMatchBySportDcId(604152);
  const openingById = await getMatch(opening.id);
  assert(openingById.homeTeam.sportdcTeamId === 8448, "Pobjeda must be home in 604152");
  assert(openingById.awayTeam.sportdcTeamId === 7802, "Away team must be Borac 7802");

  const stamp = Date.now();
  const striker = await createPlayer({
    firstName: "Smoke",
    lastName: `Napadač${stamp}`,
    position: "FW",
  });
  const playmaker = await createPlayer({
    firstName: "Smoke",
    lastName: `Veznjak${stamp}`,
    position: "MF",
  });
  const defender = await createPlayer({
    firstName: "Smoke",
    lastName: `Štoper${stamp}`,
    position: "DF",
  });
  const winger = await createPlayer({
    firstName: "Smoke",
    lastName: `Krilo${stamp}`,
    position: "WG",
  });
  assert(winger.position === "WG", "Winger should be position WG");

  const fixture = await createFixtureMatch();
  await saveMatchStatistics(fixture.id, {
    lineups: [
      { playerId: striker.id, starter: true, minutes: 90 },
      { playerId: playmaker.id, starter: true, minutes: 90 },
      { playerId: defender.id, starter: true, substitutedAt: 70 },
      { playerId: winger.id, starter: false, enteredAt: 70 },
    ],
    goals: [
      { playerId: striker.id, assistPlayerId: playmaker.id, minute: 23 },
      { playerId: striker.id, assistPlayerId: null, minute: 81 },
    ],
    cards: [{ playerId: defender.id, type: "YELLOW", minute: 64 }],
  });

  const finished = await getMatch(fixture.id);
  assert(finished.lineups.length === 4, "Fixture match must include lineup");
  assert(finished.goals.length === 2, "Fixture match must include goal events");
  assert(finished.cards.length === 1, "Fixture match must include card events");

  const lukaStats = await getPlayerStatistics(striker.id);
  assert(lukaStats.hasData, "Striker must have season stats from fixture match");
  assert(lukaStats.goals === 2, `Striker goals: expected 2, got ${lukaStats.goals}`);
  assert(lukaStats.appearances === 1, "Striker should have 1 appearance");
  assert(lukaStats.minutes === 90, "Striker should have 90 minutes");

  const darkoStats = await getPlayerStatistics(playmaker.id);
  assert(darkoStats.assists === 1, `Playmaker assists: expected 1, got ${darkoStats.assists}`);

  const stefanStats = await getPlayerStatistics(defender.id);
  assert(stefanStats.yellowCards === 1, "Defender should have 1 yellow from MatchCard");
  assert(stefanStats.minutes === 70, "Defender should have 70 minutes");

  const scorers = await getTopScorers({ limit: 5 });
  assert(scorers[0]?.playerId === striker.id, "Top scorer should be the fixture striker");
  assert(scorers[0]?.goals === 2, "Top scorer should have 2 goals");

  const assists = await getTopAssists({ limit: 5 });
  assert(assists[0]?.playerId === playmaker.id, "Top assists should be the fixture playmaker");

  const appearances = await getTopAppearances({ limit: 5 });
  assert(appearances.length >= 1, "Top appearances must not be empty after fixture lineup");
  assert(appearances[0]?.appearances >= 1, "Leaders must have at least one appearance");

  const teamStats = await getTeamStatistics();
  assert(teamStats.team.isOurTeam, "Team statistics must be for FK Pobjeda");
  assert(teamStats.nextMatch?.sportdcMatchId === 604152, "Next match should be 604152");

  const table = await getStandings();
  assert(table.rows.length === 14, `Standings must have 14 rows, got ${table.rows.length}`);
  assert(table.source === "SPORTDC", `Standings source should be SportDC, got ${table.source}`);
  assert(
    table.rows.some((row) => row.team.isOurTeam && row.team.sportdcTeamId === 8448),
    "Standings must highlight FK Pobjeda 8448",
  );

  const schedule = await getSchedule();
  assert(schedule.rounds.length >= 1, "Schedule must include at least round 1");
  const scheduledRound1 = schedule.rounds.find((round) => round.round === 1);
  assert(scheduledRound1?.matches.length === 7, "Schedule round 1 must have 7 matches");
  assert(
    schedule.matches.every((match) => match.round > 0),
    "League schedule must exclude friendlies by default",
  );

  const leagueResults = await getResults();
  assert(
    leagueResults.matches.every((match) => match.status === "FINISHED" && match.round > 0),
    "League results must be finished league matches",
  );

  const friendlyResults = await getResults({ includeFriendlies: true });
  assert(
    friendlyResults.matches.some((match) => match.sportdcMatchId === FIXTURE_MATCH_ID),
    "Friendly results should include the fixture match",
  );

  const syncStatus = await getSyncStatus();
  assert(syncStatus.lastSuccess || syncStatus.latest, "Sync status should return the latest run");

  let failed = false;
  try {
    await createPlayer({ firstName: "", lastName: "Test", position: "FW" });
  } catch (error) {
    failed = error instanceof ValidationError;
  }
  assert(failed, "createPlayer must validate empty names");

  const created = await createPlayer({
    firstName: "Faza",
    lastName: `Četiri${Date.now()}`,
    position: "MF",
    birthYear: 1999,
  });
  assert(created.slug.startsWith("faza-cetiri"), `Unexpected slug ${created.slug}`);
  assert(created.active, "New player should be active");

  const updated = await updatePlayer(created.id, { jerseyNumber: 78, formerClubs: "Tavna" });
  assert(updated.jerseyNumber === 78, "updatePlayer failed");
  assert(updated.formerClubs === "Tavna", "formerClubs update failed");

  const deactivated = await deactivatePlayer(created.id);
  assert(deactivated.active === false, "deactivatePlayer failed");

  const publicList = await getPlayers();
  assert(
    publicList.every((player) => player.id !== created.id),
    "Deactivated player must not appear on the public list",
  );

  await deletePlayer(created.id);
  const afterDelete = await prisma.player.findUnique({ where: { id: created.id } });
  assert(!afterDelete, "deletePlayer must remove a player without match stats");

  let blockedDelete = false;
  try {
    await deletePlayer(striker.id);
  } catch (error) {
    blockedDelete = error instanceof ValidationError;
  }
  assert(blockedDelete, "deletePlayer must refuse a player with match statistics");

  const history = await createHistoryEntry({
    title: "Smoke unos",
    body: "<b>Ne HTML</b> tekst",
    year: 1976,
    sortOrder: 99,
    published: false,
  });
  assert(history.body === "Ne HTML tekst", "History body must strip HTML");
  assert(history.published === false, "Unpublished history must stay off the public site");
  await deleteHistoryEntry(history.id);

  await cleanupFixtureMatch();
  await deletePlayer(striker.id);
  await deletePlayer(playmaker.id);
  await deletePlayer(defender.id);
  await deletePlayer(winger.id);

  console.log("Backend smoke OK");
  console.log(`  players: ${players.length} active`);
  console.log(`  upcoming: ${upcoming.length}, recent: ${recent.length}`);
  console.log(`  round 1: ${round1.length} matches`);
  console.log(`  standings: ${table.rows.length} (${table.source})`);
  console.log(`  schedule rounds: ${schedule.rounds.length}`);
  console.log(`  league results: ${leagueResults.matches.length}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    await cleanupFixtureMatch().catch(() => undefined);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
