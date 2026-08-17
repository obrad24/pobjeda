"use server";

import { revalidatePath } from "next/cache";
import { CACHE_TAGS, revalidatePublic } from "@/lib/query-cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { withError, withToast } from "@/lib/admin/paths";
import { ValidationError } from "@/lib/errors";
import { createPlayer, deactivatePlayer, deletePlayer, updatePlayer } from "@/lib/players";
import { uploadPlayerPhoto } from "@/lib/uploads/player-photo";
import type { CreatePlayerInput, UpdatePlayerInput } from "@/lib/validation/player";

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function optionalInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return Number(text);
}

async function imageFromForm(formData: FormData): Promise<string | null> {
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    return uploadPlayerPhoto(file);
  }
  return optionalText(formData.get("image"));
}

function playerFromForm(formData: FormData, image: string | null): CreatePlayerInput {
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    position: String(formData.get("position") ?? "") as CreatePlayerInput["position"],
    birthYear: optionalInt(formData.get("birthYear")),
    jerseyNumber: optionalInt(formData.get("jerseyNumber")),
    image,
    formerClubs: optionalText(formData.get("formerClubs")),
    active: formData.get("active") === "on",
  };
}

function revalidatePlayers(slug?: string) {
  revalidatePath("/");
  revalidatePath("/igraci");
  revalidatePath("/statistika");
  revalidatePath("/admin/igraci");
  revalidatePublic(CACHE_TAGS.players, CACHE_TAGS.stats);
  if (slug) {
    revalidatePath(`/igraci/${slug}`);
  }
}

export async function createPlayerAction(formData: FormData) {
  await requireAdmin();
  try {
    const image = await imageFromForm(formData);
    const player = await createPlayer(playerFromForm(formData, image));
    revalidatePlayers(player.slug);
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(withError("/admin/igraci/novi", error.message));
    }
    throw error;
  }
  redirect(withToast("/admin/igraci", "Igrač je dodat"));
}

export async function updatePlayerAction(playerId: string, slug: string, formData: FormData) {
  await requireAdmin();
  try {
    const image = await imageFromForm(formData);
    const data: UpdatePlayerInput = playerFromForm(formData, image);
    await updatePlayer(playerId, data);
    revalidatePlayers(slug);
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(withError(`/admin/igraci/${playerId}`, error.message));
    }
    throw error;
  }
  redirect(withToast("/admin/igraci", "Igrač je sačuvan"));
}

export async function deactivatePlayerAction(playerId: string) {
  await requireAdmin();
  const player = await deactivatePlayer(playerId);
  revalidatePlayers(player.slug);
  redirect(withToast("/admin/igraci", "Igrač je deaktiviran"));
}

export async function deletePlayerAction(playerId: string) {
  await requireAdmin();
  try {
    await deletePlayer(playerId);
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(withError(`/admin/igraci/${playerId}`, error.message));
    }
    throw error;
  }
  revalidatePlayers();
  redirect(withToast("/admin/igraci", "Igrač je obrisan"));
}
