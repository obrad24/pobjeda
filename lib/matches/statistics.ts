import { CardType } from "../../generated/prisma";
import { getOurTeam } from "../context";
import { prisma } from "../db/prisma";
import { NotFoundError, ValidationError } from "../errors";
import { recalculateMatchFantasy } from "../fantasy/recalculate";
import { parseOrThrow } from "../validation/parse";
import { idSchema } from "../validation/queries";
import {
  matchStatisticsSchema,
  type MatchStatisticsInput,
} from "../validation/match-stats";
import { getMatch } from "./service";
import { resolveMinutes } from "./minutes";

function yellowCount(type: CardType): number {
  return type === CardType.RED ? 0 : 1;
}

function redCount(type: CardType): number {
  return type === CardType.YELLOW ? 0 : 1;
}

async function assertOurMatch(matchId: string) {
  const match = await getMatch(matchId);
  const ourTeam = await getOurTeam();
  if (match.homeTeamId !== ourTeam.id && match.awayTeamId !== ourTeam.id) {
    throw new ValidationError("Sastav i statistika unose se samo za utakmice FK Pobjeda");
  }
  return match;
}

export async function saveMatchStatistics(matchId: string, input: MatchStatisticsInput) {
  const id = parseOrThrow(idSchema, matchId);
  const data = parseOrThrow(matchStatisticsSchema, input);
  const match = await assertOurMatch(id);

  const playerIds = [
    ...data.lineups.map((row) => row.playerId),
    ...data.goals.flatMap((goal) => [goal.playerId, goal.assistPlayerId ?? ""]),
    ...data.cards.map((card) => card.playerId),
    ...data.penaltyMisses.map((row) => row.playerId),
  ].filter(Boolean);

  const uniqueIds = [...new Set(playerIds)];
  if (uniqueIds.length > 0) {
    const players = await prisma.player.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (players.length !== uniqueIds.length) {
      throw new NotFoundError("Jedan od igrača nije pronađen");
    }
  }

  const hasGoalEvents = data.goals.length > 0;
  const hasCardEvents = data.cards.length > 0;

  await prisma.$transaction(async (tx) => {
    await tx.matchGoal.deleteMany({ where: { matchId: id } });
    await tx.matchCard.deleteMany({ where: { matchId: id } });
    await tx.matchPenaltyMiss.deleteMany({ where: { matchId: id } });
    await tx.matchConcededGoal.deleteMany({ where: { matchId: id } });
    await tx.matchPlayer.deleteMany({ where: { matchId: id } });

    for (const row of data.lineups) {
      const eventGoals = data.goals.filter((goal) => goal.playerId === row.playerId && !goal.ownGoal).length;
      const eventAssists = data.goals.filter(
        (goal) => goal.assistPlayerId === row.playerId && !goal.ownGoal,
      ).length;
      const eventCards = data.cards.filter((card) => card.playerId === row.playerId);

      await tx.matchPlayer.create({
        data: {
          matchId: id,
          playerId: row.playerId,
          starter: row.starter,
          minutes: resolveMinutes(row),
          enteredAt: row.enteredAt ?? null,
          substitutedAt: row.substitutedAt ?? null,
          goals: hasGoalEvents ? eventGoals : (row.goals ?? 0),
          assists: hasGoalEvents ? eventAssists : (row.assists ?? 0),
          yellowCards: hasCardEvents
            ? eventCards.reduce((sum, card) => sum + yellowCount(card.type as CardType), 0)
            : (row.yellowCards ?? 0),
          redCards: hasCardEvents
            ? eventCards.reduce((sum, card) => sum + redCount(card.type as CardType), 0)
            : (row.redCards ?? 0),
          saves: row.saves ?? 0,
          penaltySaves: row.penaltySaves ?? 0,
        },
      });
    }

    if (data.goals.length > 0) {
      await tx.matchGoal.createMany({
        data: data.goals.map((goal) => ({
          matchId: id,
          playerId: goal.playerId,
          assistPlayerId: goal.ownGoal ? null : (goal.assistPlayerId ?? null),
          minute: goal.minute,
          ownGoal: goal.ownGoal ?? false,
        })),
      });
    }

    if (data.cards.length > 0) {
      await tx.matchCard.createMany({
        data: data.cards.map((card) => ({
          matchId: id,
          playerId: card.playerId,
          type: card.type as CardType,
          minute: card.minute,
        })),
      });
    }

    if (data.penaltyMisses.length > 0) {
      await tx.matchPenaltyMiss.createMany({
        data: data.penaltyMisses.map((row) => ({
          matchId: id,
          playerId: row.playerId,
          minute: row.minute,
        })),
      });
    }

    if (data.concededGoals.length > 0) {
      await tx.matchConcededGoal.createMany({
        data: data.concededGoals.map((row) => ({
          matchId: id,
          minute: row.minute,
        })),
      });
    }
  });

  await recalculateMatchFantasy(id);

  return getMatch(match.id);
}

export async function saveMatchLineup(
  matchId: string,
  lineups: MatchStatisticsInput["lineups"],
) {
  const existing = await getMatch(parseOrThrow(idSchema, matchId));
  const allowed = new Set(lineups.map((row) => row.playerId));
  return saveMatchStatistics(matchId, {
    lineups,
    goals: existing.goals
      .filter((goal) => allowed.has(goal.playerId) && (!goal.assistPlayerId || allowed.has(goal.assistPlayerId)))
      .map((goal) => ({
        playerId: goal.playerId,
        assistPlayerId: goal.assistPlayerId,
        minute: goal.minute,
        ownGoal: goal.ownGoal,
      })),
    cards: existing.cards
      .filter((card) => allowed.has(card.playerId))
      .map((card) => ({
        playerId: card.playerId,
        type: card.type,
        minute: card.minute,
      })),
    penaltyMisses: existing.penaltyMisses
      .filter((row) => allowed.has(row.playerId))
      .map((row) => ({ playerId: row.playerId, minute: row.minute })),
    concededGoals: existing.concededGoals.map((row) => ({ minute: row.minute })),
  });
}

export async function saveMatchEvents(
  matchId: string,
  events: Pick<MatchStatisticsInput, "goals" | "cards">,
) {
  const existing = await getMatch(parseOrThrow(idSchema, matchId));
  return saveMatchStatistics(matchId, {
    lineups: existing.lineups.map((row) => ({
      playerId: row.playerId,
      starter: row.starter,
      minutes: row.minutes,
      enteredAt: row.enteredAt,
      substitutedAt: row.substitutedAt,
      saves: row.saves,
      penaltySaves: row.penaltySaves,
    })),
    goals: events.goals ?? [],
    cards: events.cards ?? [],
    penaltyMisses: existing.penaltyMisses.map((row) => ({
      playerId: row.playerId,
      minute: row.minute,
    })),
    concededGoals: existing.concededGoals.map((row) => ({ minute: row.minute })),
  });
}
