import { Prisma } from "../generated/prisma";
import { prisma } from "./db/prisma";
import { NotFoundError, ValidationError } from "./errors";
import { ensureFantasyRules } from "./fantasy/store";
import { parseOrThrow } from "./validation/parse";
import { seasonIdSchema, seasonInputSchema, type SeasonInput } from "./validation/admin";

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  return new Date(`${value}T00:00:00.000Z`);
}

async function setActiveExclusive(id: string) {
  await prisma.$transaction([
    prisma.season.updateMany({ data: { active: false } }),
    prisma.season.update({ where: { id }, data: { active: true } }),
  ]);
}

function isUniqueNameError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function getSeasons() {
  return prisma.season.findMany({
    orderBy: [{ startDate: "desc" }, { name: "desc" }],
    include: {
      _count: { select: { matches: true, leagues: true } },
    },
  });
}

export async function getSeason(id: string) {
  const seasonId = parseOrThrow(seasonIdSchema, id);
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      _count: { select: { matches: true, leagues: true } },
    },
  });
  if (!season) {
    throw new NotFoundError("Sezona nije pronađena");
  }
  return season;
}

export async function createSeason(input: SeasonInput) {
  const data = parseOrThrow(seasonInputSchema, input);
  try {
    const season = await prisma.season.create({
      data: {
        name: data.name,
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
        active: false,
      },
    });
    await ensureFantasyRules(season.id);
    if (data.active) {
      await setActiveExclusive(season.id);
      return getSeason(season.id);
    }
    return season;
  } catch (error) {
    if (isUniqueNameError(error)) {
      throw new ValidationError("Sezona s tim imenom već postoji");
    }
    throw error;
  }
}

export async function updateSeason(id: string, input: SeasonInput) {
  const seasonId = parseOrThrow(seasonIdSchema, id);
  const data = parseOrThrow(seasonInputSchema, input);
  await getSeason(seasonId);

  try {
    await prisma.season.update({
      where: { id: seasonId },
      data: {
        name: data.name,
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
      },
    });
  } catch (error) {
    if (isUniqueNameError(error)) {
      throw new ValidationError("Sezona s tim imenom već postoji");
    }
    throw error;
  }

  if (data.active) {
    await setActiveExclusive(seasonId);
  }

  return getSeason(seasonId);
}

export async function activateSeason(id: string) {
  const season = await getSeason(id);
  await setActiveExclusive(season.id);
  return getSeason(season.id);
}

export async function deactivateSeason(id: string) {
  const season = await getSeason(id);
  return prisma.season.update({
    where: { id: season.id },
    data: { active: false },
  });
}
