import { z } from "zod";
import { idSchema } from "./queries";

const minuteSchema = z.number().int().min(0).max(130);

export const lineupRowSchema = z.object({
  playerId: idSchema,
  starter: z.boolean(),
  minutes: z.number().int().min(0).max(130).optional().nullable(),
  enteredAt: minuteSchema.optional().nullable(),
  substitutedAt: minuteSchema.optional().nullable(),
  goals: z.number().int().min(0).max(20).optional(),
  assists: z.number().int().min(0).max(20).optional(),
  yellowCards: z.number().int().min(0).max(2).optional(),
  redCards: z.number().int().min(0).max(1).optional(),
  saves: z.number().int().min(0).max(30).optional(),
  penaltySaves: z.number().int().min(0).max(10).optional(),
});

export const matchGoalInputSchema = z.object({
  playerId: idSchema,
  assistPlayerId: idSchema.optional().nullable(),
  minute: minuteSchema,
  ownGoal: z.boolean().optional().default(false),
});

export const matchCardInputSchema = z.object({
  playerId: idSchema,
  type: z.enum(["YELLOW", "RED", "SECOND_YELLOW"]),
  minute: minuteSchema,
});

export const matchPenaltyMissInputSchema = z.object({
  playerId: idSchema,
  minute: minuteSchema,
});

export const matchConcededGoalInputSchema = z.object({
  minute: minuteSchema,
});

export const matchStatisticsSchema = z
  .object({
    lineups: z.array(lineupRowSchema).max(25),
    goals: z.array(matchGoalInputSchema).max(30).optional().default([]),
    cards: z.array(matchCardInputSchema).max(30).optional().default([]),
    penaltyMisses: z.array(matchPenaltyMissInputSchema).max(20).optional().default([]),
    concededGoals: z.array(matchConcededGoalInputSchema).max(20).optional().default([]),
  })
  .superRefine((data, ctx) => {
    const ids = data.lineups.map((row) => row.playerId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Isti igrač ne može biti dvaput u sastavu", path: ["lineups"] });
    }

    const starters = data.lineups.filter((row) => row.starter).length;
    if (starters > 11) {
      ctx.addIssue({ code: "custom", message: "Najviše 11 startera", path: ["lineups"] });
    }

    const lineupSet = new Set(ids);
    for (const [index, goal] of data.goals.entries()) {
      if (!lineupSet.has(goal.playerId)) {
        ctx.addIssue({
          code: "custom",
          message: "Strijelac mora biti u sastavu",
          path: ["goals", index, "playerId"],
        });
      }
      if (goal.assistPlayerId && !lineupSet.has(goal.assistPlayerId)) {
        ctx.addIssue({
          code: "custom",
          message: "Asistent mora biti u sastavu",
          path: ["goals", index, "assistPlayerId"],
        });
      }
      if (goal.assistPlayerId && goal.assistPlayerId === goal.playerId) {
        ctx.addIssue({
          code: "custom",
          message: "Igrač ne može asistirati sam sebi",
          path: ["goals", index, "assistPlayerId"],
        });
      }
      if (goal.ownGoal && goal.assistPlayerId) {
        ctx.addIssue({
          code: "custom",
          message: "Autogol ne može imati asistenciju",
          path: ["goals", index, "assistPlayerId"],
        });
      }
    }

    for (const [index, card] of data.cards.entries()) {
      if (!lineupSet.has(card.playerId)) {
        ctx.addIssue({
          code: "custom",
          message: "Karton mora pripadati igraču iz sastava",
          path: ["cards", index, "playerId"],
        });
      }
    }

    for (const [index, miss] of data.penaltyMisses.entries()) {
      if (!lineupSet.has(miss.playerId)) {
        ctx.addIssue({
          code: "custom",
          message: "Promašen penal mora pripadati igraču iz sastava",
          path: ["penaltyMisses", index, "playerId"],
        });
      }
    }
  });

export type LineupRowInput = z.input<typeof lineupRowSchema>;
export type MatchStatisticsInput = z.input<typeof matchStatisticsSchema>;
export type MatchStatistics = z.output<typeof matchStatisticsSchema>;
