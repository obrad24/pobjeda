"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withError, withToast } from "@/lib/admin/paths";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ValidationError } from "@/lib/errors";
import { CACHE_TAGS, revalidatePublic } from "@/lib/query-cache";
import { activateSeason, createSeason, deactivateSeason, updateSeason } from "@/lib/seasons";

function seasonFromForm(formData: FormData) {
  const start = String(formData.get("startDate") ?? "").trim();
  const end = String(formData.get("endDate") ?? "").trim();
  return {
    name: String(formData.get("name") ?? ""),
    startDate: start || null,
    endDate: end || null,
    active: formData.get("active") === "on",
  };
}

function revalidateSeasons() {
  revalidatePath("/");
  revalidatePath("/liga");
  revalidatePath("/admin");
  revalidatePath("/admin/sezone");
  revalidatePath("/admin/liga");
  revalidatePublic(CACHE_TAGS.league, CACHE_TAGS.stats, CACHE_TAGS.fantasy);
}

export async function createSeasonAction(formData: FormData) {
  await requireAdmin();
  try {
    await createSeason(seasonFromForm(formData));
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(withError("/admin/sezone", error.message));
    }
    throw error;
  }
  revalidateSeasons();
  redirect(withToast("/admin/sezone", "Sezona je dodata"));
}

export async function updateSeasonAction(seasonId: string, formData: FormData) {
  await requireAdmin();
  try {
    await updateSeason(seasonId, seasonFromForm(formData));
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(withError("/admin/sezone", error.message));
    }
    throw error;
  }
  revalidateSeasons();
  redirect(withToast("/admin/sezone", "Sezona je sačuvana"));
}

export async function activateSeasonAction(seasonId: string) {
  await requireAdmin();
  await activateSeason(seasonId);
  revalidateSeasons();
  redirect(withToast("/admin/sezone", "Sezona je aktivirana"));
}

export async function deactivateSeasonAction(seasonId: string) {
  await requireAdmin();
  await deactivateSeason(seasonId);
  revalidateSeasons();
  redirect(withToast("/admin/sezone", "Sezona je deaktivirana"));
}
