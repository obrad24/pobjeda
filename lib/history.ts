import { prisma } from "./db/prisma";
import { NotFoundError } from "./errors";
import { stripHtmlTags } from "./text";
import { parseOrThrow } from "./validation/parse";
import { historyIdSchema, historyInputSchema, type HistoryInput } from "./validation/admin";

export async function getClubHistory() {
  return prisma.clubHistory.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { year: "asc" }],
  });
}

export async function getClubHistoryAdmin() {
  return prisma.clubHistory.findMany({
    orderBy: [{ sortOrder: "asc" }, { year: "asc" }, { createdAt: "asc" }],
  });
}

export async function getHistoryEntry(id: string) {
  const entryId = parseOrThrow(historyIdSchema, id);
  const entry = await prisma.clubHistory.findUnique({ where: { id: entryId } });
  if (!entry) {
    throw new NotFoundError("Unos istorije nije pronađen");
  }
  return entry;
}

export async function createHistoryEntry(input: HistoryInput) {
  const data = parseOrThrow(historyInputSchema, input);
  return prisma.clubHistory.create({
    data: {
      title: stripHtmlTags(data.title).trim(),
      body: stripHtmlTags(data.body).trim(),
      year: data.year ?? null,
      sortOrder: data.sortOrder ?? 0,
      published: data.published ?? true,
    },
  });
}

export async function updateHistoryEntry(id: string, input: HistoryInput) {
  const entryId = parseOrThrow(historyIdSchema, id);
  const data = parseOrThrow(historyInputSchema, input);
  await getHistoryEntry(entryId);

  return prisma.clubHistory.update({
    where: { id: entryId },
    data: {
      title: stripHtmlTags(data.title).trim(),
      body: stripHtmlTags(data.body).trim(),
      year: data.year ?? null,
      sortOrder: data.sortOrder ?? 0,
      published: data.published ?? true,
    },
  });
}

export async function deleteHistoryEntry(id: string) {
  const entryId = parseOrThrow(historyIdSchema, id);
  await getHistoryEntry(entryId);
  await prisma.clubHistory.delete({ where: { id: entryId } });
}
