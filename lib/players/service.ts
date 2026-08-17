import { Position, type Player } from "../../generated/prisma";
import { prisma } from "../db/prisma";
import { NotFoundError, ValidationError } from "../errors";
import { slugifyName } from "../utils/slug";
import { parseOrThrow } from "../validation/parse";
import {
  createPlayerSchema,
  playerIdSchema,
  playerSlugParamSchema,
  updatePlayerSchema,
  type CreatePlayerInput,
  type UpdatePlayerInput,
} from "../validation/player";
import { listPlayersQuerySchema, type ListPlayersQuery } from "../validation/queries";

async function allocateSlug(base: string, excludeId?: string): Promise<string> {
  const existing = await prisma.player.findMany({
    where: {
      slug: { startsWith: base },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { slug: true },
  });
  const taken = new Set(existing.map((row) => row.slug));
  if (!taken.has(base)) {
    return base;
  }

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

async function assertUniqueJersey(jerseyNumber: number | null | undefined, excludeId?: string) {
  if (jerseyNumber == null) {
    return;
  }

  const clash = await prisma.player.findFirst({
    where: {
      jerseyNumber,
      active: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (clash) {
    throw new ValidationError(
      `Broj ${jerseyNumber} je već zauzet (${clash.firstName} ${clash.lastName})`,
    );
  }
}

export async function getPlayers(options?: ListPlayersQuery): Promise<Player[]> {
  const query = parseOrThrow(listPlayersQuerySchema, options ?? {});

  return prisma.player.findMany({
    where: {
      ...(query.includeInactive ? {} : { active: true }),
      ...(query.position ? { position: query.position } : {}),
    },
    orderBy: [{ jerseyNumber: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getPlayer(id: string): Promise<Player> {
  const playerId = parseOrThrow(playerIdSchema, id);
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new NotFoundError("Igrač nije pronađen");
  }
  return player;
}

export async function getPlayerBySlug(slug: string): Promise<Player> {
  const value = parseOrThrow(playerSlugParamSchema, slug);
  const player = await prisma.player.findUnique({ where: { slug: value } });
  if (!player) {
    throw new NotFoundError("Igrač nije pronađen");
  }
  return player;
}

export async function createPlayer(input: CreatePlayerInput): Promise<Player> {
  const data = parseOrThrow(createPlayerSchema, input);
  await assertUniqueJersey(data.jerseyNumber);

  const baseSlug = data.slug ?? slugifyName(data.firstName, data.lastName);
  if (!baseSlug) {
    throw new ValidationError("Nije moguće napraviti slug od imena");
  }

  return prisma.player.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      birthYear: data.birthYear ?? null,
      jerseyNumber: data.jerseyNumber ?? null,
      position: data.position as Position,
      image: data.image ?? null,
      formerClubs: data.formerClubs ?? null,
      active: data.active ?? true,
      slug: await allocateSlug(baseSlug),
    },
  });
}

export async function updatePlayer(id: string, input: UpdatePlayerInput): Promise<Player> {
  const playerId = parseOrThrow(playerIdSchema, id);
  const data = parseOrThrow(updatePlayerSchema, input);
  const existing = await getPlayer(playerId);

  if (data.jerseyNumber !== undefined) {
    await assertUniqueJersey(data.jerseyNumber, playerId);
  }

  let slug = existing.slug;
  if (data.slug) {
    slug = await allocateSlug(data.slug, playerId);
  }

  return prisma.player.update({
    where: { id: playerId },
    data: {
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.birthYear !== undefined ? { birthYear: data.birthYear } : {}),
      ...(data.jerseyNumber !== undefined ? { jerseyNumber: data.jerseyNumber } : {}),
      ...(data.position !== undefined ? { position: data.position as Position } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
      ...(data.formerClubs !== undefined ? { formerClubs: data.formerClubs } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      slug,
    },
  });
}

export async function deactivatePlayer(id: string): Promise<Player> {
  const playerId = parseOrThrow(playerIdSchema, id);
  await getPlayer(playerId);

  return prisma.player.update({
    where: { id: playerId },
    data: { active: false },
  });
}

export async function getPlayerUsage(id: string) {
  const playerId = parseOrThrow(playerIdSchema, id);
  await getPlayer(playerId);

  const [appearances, goals, assists, cards, penaltyMisses, fantasyPoints] = await Promise.all([
    prisma.matchPlayer.count({ where: { playerId } }),
    prisma.matchGoal.count({ where: { playerId } }),
    prisma.matchGoal.count({ where: { assistPlayerId: playerId } }),
    prisma.matchCard.count({ where: { playerId } }),
    prisma.matchPenaltyMiss.count({ where: { playerId } }),
    prisma.fantasyMatchPoints.count({ where: { playerId } }),
  ]);

  return {
    appearances,
    goals,
    assists,
    cards,
    penaltyMisses,
    fantasyPoints,
    canDelete: appearances + goals + assists + cards + penaltyMisses + fantasyPoints === 0,
  };
}

export async function deletePlayer(id: string): Promise<void> {
  const playerId = parseOrThrow(playerIdSchema, id);
  await getPlayer(playerId);
  const usage = await getPlayerUsage(playerId);

  if (!usage.canDelete) {
    throw new ValidationError(
      "Igrač ima sastav, golove, asistencije, kartone ili fantasy bodove. Deaktivirajte ga umjesto brisanja.",
    );
  }

  await prisma.player.delete({ where: { id: playerId } });
}
