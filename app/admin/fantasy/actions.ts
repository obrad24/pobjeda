"use server";

import { revalidatePath } from "next/cache";
import { CACHE_TAGS, revalidatePublic } from "@/lib/query-cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { recalculateSeasonFantasy } from "@/lib/fantasy";
import { resolveSeason } from "@/lib/context";

export async function recalculateFantasyAction(seasonId?: string) {
  await requireAdmin();
  const season = await resolveSeason(seasonId);
  const result = await recalculateSeasonFantasy(season.id);
  revalidatePath("/fantasy");
  revalidatePath("/igraci");
  revalidatePath("/admin/fantasy");
  revalidatePublic(CACHE_TAGS.fantasy);
  return { ok: true as const, ...result };
}
