import { Prisma } from "../../generated/prisma";
import { getOurTeam } from "../context";
import { prisma } from "../db/prisma";
import { NotFoundError } from "../errors";
import { calculateMatchFantasy } from "./calculator";
import { getSeasonScoringRules } from "./store";
import type { MatchFantasySource } from "./types";

function ourGoalsAgainst(match: {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}, ourTeamId: string): { goalsAgainst: number; scoreKnown: boolean } {
  const scoreKnown =
    match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
  if (!scoreKnown) {
    return { goalsAgainst: 1, scoreKnown: false };
  }
  const against = match.homeTeamId === ourTeamId ? match.awayScore : match.homeScore;
  return { goalsAgainst: against ?? 0, scoreKnown: true };
}

export async function recalculateMatchFantasy(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      lineups: { include: { player: true } },
      goals: true,
      cards: true,
      penaltyMisses: true,
      concededGoals: true,
    },
  });

  if (!match) {
    throw new NotFoundError("Utakmica nije pronađena");
  }

  const ourTeam = await getOurTeam();
  const isOurs = match.homeTeamId === ourTeam.id || match.awayTeamId === ourTeam.id;

  if (!isOurs || match.lineups.length === 0) {
    await prisma.fantasyMatchPoints.deleteMany({ where: { matchId } });
    return [];
  }

  const { goalsAgainst } = ourGoalsAgainst(match, ourTeam.id);
  const rules = await getSeasonScoringRules(match.seasonId);

  const source: MatchFantasySource = {
    goalsAgainst,
    concededMinutes: match.concededGoals.map((row) => row.minute),
    lineups: match.lineups.map((row) => ({
      playerId: row.playerId,
      position: row.player.position,
      minutes: row.minutes,
      starter: row.starter,
      enteredAt: row.enteredAt,
      substitutedAt: row.substitutedAt,
      saves: row.saves,
      penaltySaves: row.penaltySaves,
      goals: row.goals,
      assists: row.assists,
      yellowCards: row.yellowCards,
      redCards: row.redCards,
    })),
    goals: match.goals.map((goal) => ({
      playerId: goal.playerId,
      assistPlayerId: goal.assistPlayerId,
      ownGoal: goal.ownGoal,
    })),
    cards: match.cards.map((card) => ({
      playerId: card.playerId,
      type: card.type,
    })),
    penaltyMisses: match.penaltyMisses.map((row) => ({ playerId: row.playerId })),
  };

  const results = calculateMatchFantasy(source, rules);
  const calculatedAt = new Date();
  const keep = new Set(results.map((row) => row.playerId));

  await prisma.$transaction(async (tx) => {
    await tx.fantasyMatchPoints.deleteMany({
      where: { matchId, playerId: { notIn: [...keep] } },
    });

    for (const row of results) {
      await tx.fantasyMatchPoints.upsert({
        where: { matchId_playerId: { matchId, playerId: row.playerId } },
        create: {
          matchId,
          playerId: row.playerId,
          points: row.points,
          breakdown: row.breakdown as unknown as Prisma.InputJsonValue,
          calculatedAt,
        },
        update: {
          points: row.points,
          breakdown: row.breakdown as unknown as Prisma.InputJsonValue,
          calculatedAt,
        },
      });
    }
  });

  return results;
}

export async function recalculateSeasonFantasy(seasonId: string) {
  const ourTeam = await getOurTeam();
  const matches = await prisma.match.findMany({
    where: {
      seasonId,
      OR: [{ homeTeamId: ourTeam.id }, { awayTeamId: ourTeam.id }],
    },
    select: { id: true },
    orderBy: { date: "asc" },
  });

  let updated = 0;
  for (const match of matches) {
    const rows = await recalculateMatchFantasy(match.id);
    updated += rows.length;
  }
  return { matches: matches.length, rows: updated };
}
