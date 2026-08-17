"use server";

import { revalidatePath } from "next/cache";
import { CACHE_TAGS, revalidatePublic } from "@/lib/query-cache";
import { redirect } from "next/navigation";
import { withError, withToast } from "@/lib/admin/paths";
import { requireAdmin } from "@/lib/auth/require-admin";
import { triggerSportDcSync } from "@/lib/sportdc/sync";

export async function triggerSyncAction() {
  await requireAdmin();

  try {
    const result = await triggerSportDcSync();
    revalidatePath("/");
    revalidatePath("/liga");
    revalidatePath("/rezultati");
    revalidatePath("/admin");
    revalidatePath("/admin/liga");
    revalidatePath("/admin/utakmice");
    revalidatePublic(CACHE_TAGS.league);

    if (!result.ok) {
      redirect(withError("/admin/liga", result.errorMessage ?? "Sync nije uspio"));
    }

    redirect(
      withToast(
        "/admin/liga",
        `Sinhronizacija je završena (${result.teamsUpserted} timova, ${result.matchesUpserted} utakmica)`,
      ),
    );
  } catch (error) {
    if ((error as { code?: string }).code === "SYNC_IN_PROGRESS") {
      redirect(withError("/admin/liga", "Sync je već u toku"));
    }
    throw error;
  }
}
