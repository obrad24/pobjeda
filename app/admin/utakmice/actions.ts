"use server";

import { revalidatePath } from "next/cache";
import { CACHE_TAGS, revalidatePublic } from "@/lib/query-cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ValidationError } from "@/lib/errors";
import { saveMatchStatistics } from "@/lib/matches";
import type { MatchStatisticsInput } from "@/lib/validation/match-stats";

export async function saveMatchStatisticsAction(matchId: string, payload: MatchStatisticsInput) {
  await requireAdmin();
  try {
    const match = await saveMatchStatistics(matchId, payload);
    revalidatePath("/");
    revalidatePath("/liga");
    revalidatePath("/rezultati");
    revalidatePath("/statistika");
    revalidatePath("/fantasy");
    revalidatePath("/igraci");
    revalidatePath(`/utakmice/${match.id}`);
    revalidatePath(`/admin/utakmice/${match.id}`);
    revalidatePublic(CACHE_TAGS.stats, CACHE_TAGS.fantasy, CACHE_TAGS.league);
    for (const row of match.lineups) {
      revalidatePath(`/igraci/${row.player.slug}`);
    }
    return { ok: true as const };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { ok: false as const, error: error.message };
    }
    throw error;
  }
}
