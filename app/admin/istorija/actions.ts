"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withError, withToast } from "@/lib/admin/paths";
import { requireAdmin } from "@/lib/auth/require-admin";
import { ValidationError } from "@/lib/errors";
import { createHistoryEntry, deleteHistoryEntry, updateHistoryEntry } from "@/lib/history";
import { CACHE_TAGS, revalidatePublic } from "@/lib/query-cache";

function optionalInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return Number(text);
}

function historyFromForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    year: optionalInt(formData.get("year")),
    sortOrder: optionalInt(formData.get("sortOrder")) ?? 0,
    published: formData.get("published") === "on",
  };
}

function revalidateHistory() {
  revalidatePath("/istorija");
  revalidatePath("/admin/istorija");
  revalidatePublic(CACHE_TAGS.history);
}

export async function createHistoryAction(formData: FormData) {
  await requireAdmin();
  try {
    await createHistoryEntry(historyFromForm(formData));
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(withError("/admin/istorija", error.message));
    }
    throw error;
  }
  revalidateHistory();
  redirect(withToast("/admin/istorija", "Unos istorije je dodat"));
}

export async function updateHistoryAction(id: string, formData: FormData) {
  await requireAdmin();
  try {
    await updateHistoryEntry(id, historyFromForm(formData));
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(withError("/admin/istorija", error.message));
    }
    throw error;
  }
  revalidateHistory();
  redirect(withToast("/admin/istorija", "Istorija je sačuvana"));
}

export async function deleteHistoryAction(id: string) {
  await requireAdmin();
  await deleteHistoryEntry(id);
  revalidateHistory();
  redirect(withToast("/admin/istorija", "Unos je obrisan"));
}
