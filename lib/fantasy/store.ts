import { prisma } from "../db/prisma";
import { DEFAULT_SCORING_RULES } from "./rules";
import { rulesFromRows } from "./rules";
import type { ScoringRules } from "./types";

export async function ensureFantasyRules(seasonId: string) {
  const existing = await prisma.fantasyScoringRule.findMany({ where: { seasonId } });
  const have = new Set(existing.map((row) => row.key));
  const missing = DEFAULT_SCORING_RULES.filter((rule) => !have.has(rule.key));

  if (missing.length > 0) {
    await prisma.fantasyScoringRule.createMany({
      data: missing.map((rule) => ({
        seasonId,
        key: rule.key,
        name: rule.name,
        points: rule.points,
        active: true,
      })),
    });
  }

  return prisma.fantasyScoringRule.findMany({
    where: { seasonId },
    orderBy: { key: "asc" },
  });
}

export async function getSeasonScoringRules(seasonId: string): Promise<ScoringRules> {
  const rows = await ensureFantasyRules(seasonId);
  return rulesFromRows(rows);
}
