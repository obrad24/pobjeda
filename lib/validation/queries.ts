import { z } from "zod";
import { positionSchema } from "./player";

export const idSchema = z.string().trim().min(1).max(64);

export const listPlayersQuerySchema = z.object({
  includeInactive: z.boolean().optional(),
  position: positionSchema.optional(),
});

export const matchStatusSchema = z.enum([
  "SCHEDULED",
  "LIVE",
  "FINISHED",
  "POSTPONED",
  "CANCELLED",
]);

export const matchListQuerySchema = z.object({
  seasonId: idSchema.optional(),
  leagueId: idSchema.optional(),
  ourTeamOnly: z.boolean().optional(),
  includeFriendlies: z.boolean().optional(),
  limit: z.number().int().min(1).max(200).optional(),
  round: z.number().int().min(0).max(52).optional(),
  status: matchStatusSchema.optional(),
});

export const statsQuerySchema = z.object({
  seasonId: idSchema.optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const standingsQuerySchema = z.object({
  seasonId: idSchema.optional(),
  leagueId: idSchema.optional(),
});

export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;
export type MatchListQuery = z.infer<typeof matchListQuerySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type StandingsQuery = z.infer<typeof standingsQuerySchema>;
