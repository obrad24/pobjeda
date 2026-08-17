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
  getPlayerBySlug,
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

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const leftover = await prisma.match.findUnique({ where: { sportdcMatchId: 800002 } });
  if (leftover) {
    await prisma.matchPlayer.deleteMany({ where: { matchId: leftover.id } });
    await prisma.matchGoal.deleteMany({ where: { matchId: leftover.id } });
    await prisma.matchCard.deleteMany({ where: { matchId: leftover.id } });
  }

  const players = await getPlayers();
  assert(players.length >= 15, `Expected at least 15 active players, got ${players.length}`);
  assert(
    players.every((player) => player.active),
    "getPlayers must hide inactive players by default",
  );

  const withInactive = await getPlayers({ includeInactive: true });
  assert(
    withInactive.some((player) => player.slug === "predrag-zivanovic" && !player.active),
    "Inactive seed player Predrag Živanović must appear when includeInactive is true",
  );

  const luka = await getPlayerBySlug("luka-popovic");
  assert(luka.position === "FW", "Luka Popović must be a forward");
  assert(luka.jerseyNumber === 7, "Luka Popović must wear 7");

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
  assert(recent.length >= 2, "Expected seeded finished matches in recent results");
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

  const finished = await getMatchBySportDcId(800001);
  assert(finished.lineups.length >= 12, "Finished match must include lineup");
  assert(finished.goals.length === 2, "Finished match must include goal events");
  assert(finished.cards.length === 1, "Finished match must include card events");

  const lukaStats = await getPlayerStatistics(luka.id);
  assert(lukaStats.hasData, "Luka must have season stats from seed match");
  assert(lukaStats.goals === 2, `Luka goals: expected 2, got ${lukaStats.goals}`);
  assert(lukaStats.appearances === 1, "Luka should have 1 appearance");
  assert(lukaStats.minutes === 90, "Luka should have 90 minutes");

  const darko = await getPlayerBySlug("darko-lukic");
  const darkoStats = await getPlayerStatistics(darko.id);
  assert(darkoStats.assists === 1, `Darko assists: expected 1, got ${darkoStats.assists}`);

  const stefan = await getPlayerBySlug("stefan-ilic");
  const stefanStats = await getPlayerStatistics(stefan.id);
  assert(stefanStats.yellowCards === 1, "Stefan should have 1 yellow from MatchCard");
  assert(stefanStats.minutes === 70, "Stefan should have 70 minutes");

  const scorers = await getTopScorers({ limit: 5 });
  assert(scorers[0]?.player.slug === "luka-popovic", "Top scorer should be Luka Popović");
  assert(scorers[0]?.goals === 2, "Top scorer should have 2 goals");

  const assists = await getTopAssists({ limit: 5 });
  assert(assists[0]?.player.slug === "darko-lukic", "Top assists should be Darko Lukić");

  const appearances = await getTopAppearances({ limit: 5 });
  assert(appearances.length >= 1, "Top appearances must not be empty after seed lineup");
  assert(appearances[0]?.appearances >= 1, "Leaders must have at least one appearance");

  const teamStats = await getTeamStatistics();
  assert(teamStats.team.isOurTeam, "Team statistics must be for FK Pobjeda");
  assert(teamStats.played === 2, `Team played: expected 2 friendlies, got ${teamStats.played}`);
  assert(teamStats.won === 1 && teamStats.drawn === 1 && teamStats.lost === 0, "Team record 1-1-0");
  assert(teamStats.goalsFor === 3 && teamStats.goalsAgainst === 2, "Team goals 3:2");
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
    friendlyResults.matches.some((match) => match.sportdcMatchId === 800001),
    "Friendly results should include seed match 800001",
  );

  const filip = await getPlayerBySlug("filip-marinkovic");
  assert(filip.position === "WG", "Filip Marinković should be a winger (Krilo)");

  const awayFriendly = await getMatchBySportDcId(800002);
  await saveMatchStatistics(awayFriendly.id, {
    lineups: [
      { playerId: filip.id, starter: true, minutes: 90 },
      { playerId: luka.id, starter: true, substitutedAt: 80 },
    ],
    goals: [],
    cards: [],
  });
  const afterSave = await getPlayerStatistics(filip.id);
  assert(afterSave.appearances === 2, `Filip appearances expected 2, got ${afterSave.appearances}`);
  assert(afterSave.goals === 0, "SportDC 1-1 must not create a player goal");
  const lukaAfter = await getPlayerStatistics(luka.id);
  assert(lukaAfter.goals === 2, "Luka goals stay from MatchGoal events, not SportDC score");
  assert(lukaAfter.appearances === 2, "Luka should have two appearances after second lineup");
  assert(lukaAfter.minutes === 170, `Luka minutes expected 170, got ${lukaAfter.minutes}`);

  await prisma.matchPlayer.deleteMany({ where: { matchId: awayFriendly.id } });
  await prisma.matchGoal.deleteMany({ where: { matchId: awayFriendly.id } });
  await prisma.matchCard.deleteMany({ where: { matchId: awayFriendly.id } });
  await prisma.fantasyMatchPoints.deleteMany({ where: { matchId: awayFriendly.id } });

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
    await deletePlayer(luka.id);
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

  console.log("Backend smoke OK");
  console.log(`  players: ${players.length} active / ${withInactive.length} total`);
  console.log(`  upcoming: ${upcoming.length}, recent: ${recent.length}`);
  console.log(`  round 1: ${round1.length} matches`);
  console.log(`  standings: ${table.rows.length} (${table.source})`);
  console.log(`  schedule rounds: ${schedule.rounds.length}`);
  console.log(`  league results: ${leagueResults.matches.length}`);
  console.log(`  top scorer: ${scorers[0]?.player.slug} (${scorers[0]?.goals})`);
  console.log(`  team: ${teamStats.won}W ${teamStats.drawn}D ${teamStats.lost}L`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
