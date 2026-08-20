"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { withError, withToast } from "@/lib/admin/paths";
import { actionFailureMessage, ValidationError } from "@/lib/errors";
import { CACHE_TAGS, revalidatePublic } from "@/lib/query-cache";
import {
  createShopProduct,
  deleteShopProduct,
  parseMoney,
  updateShopOrderStatus,
  updateShopProduct,
} from "@/lib/shop";
import { isUploadedPhoto, uploadPublicImage } from "@/lib/uploads/player-photo";
import type { ShopOrderStatus } from "../../../generated/prisma";

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function optionalInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return Number(text);
}

async function imageFromForm(
  formData: FormData,
  fileKey: string,
  urlKey: string,
  existingKey: string,
  removeKey: string,
): Promise<string | null> {
  const file = formData.get(fileKey);
  if (isUploadedPhoto(file)) {
    return uploadPublicImage(file, "shop");
  }
  if (formData.get(removeKey) === "on") {
    return null;
  }
  return optionalText(formData.get(urlKey)) ?? optionalText(formData.get(existingKey));
}

async function productFromForm(formData: FormData) {
  const image1 = await imageFromForm(formData, "photo1", "image1", "existingImage1", "removeImage1");
  const image2 = await imageFromForm(formData, "photo2", "image2", "existingImage2", "removeImage2");
  const price = parseMoney(formData.get("price"));
  if (price == null) {
    throw new ValidationError("Unesite cijenu");
  }
  return {
    name: String(formData.get("name") ?? ""),
    description: optionalText(formData.get("description")),
    price,
    discountPercent: optionalInt(formData.get("discountPercent")) || null,
    image1,
    image2: image1 ? image2 : null,
    active: formData.get("active") === "on",
    sortOrder: optionalInt(formData.get("sortOrder")) ?? 0,
  };
}

function revalidateShop() {
  revalidatePath("/shop");
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/narudzbe");
  revalidatePublic(CACHE_TAGS.shop);
}

export async function createShopProductAction(formData: FormData) {
  await requireAdmin();
  try {
    await createShopProduct(await productFromForm(formData));
  } catch (error) {
    unstable_rethrow(error);
    console.error("createShopProductAction", error);
    redirect(
      withError(
        "/admin/shop/novi",
        actionFailureMessage(error, "Čuvanje proizvoda nije uspjelo. Slike: JPEG/PNG/WebP/GIF do 4 MB."),
      ),
    );
  }
  revalidateShop();
  redirect(withToast("/admin/shop", "Proizvod je dodat"));
}

export async function updateShopProductAction(productId: string, formData: FormData) {
  await requireAdmin();
  try {
    await updateShopProduct(productId, await productFromForm(formData));
  } catch (error) {
    unstable_rethrow(error);
    console.error("updateShopProductAction", error);
    redirect(
      withError(
        `/admin/shop/${productId}`,
        actionFailureMessage(error, "Čuvanje proizvoda nije uspjelo. Slike: JPEG/PNG/WebP/GIF do 4 MB."),
      ),
    );
  }
  revalidateShop();
  redirect(withToast("/admin/shop", "Proizvod je sačuvan"));
}

export async function deleteShopProductAction(productId: string) {
  await requireAdmin();
  try {
    await deleteShopProduct(productId);
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(withError(`/admin/shop/${productId}`, error.message));
    }
    throw error;
  }
  revalidateShop();
  redirect(withToast("/admin/shop", "Proizvod je obrisan"));
}

export async function updateShopOrderStatusAction(orderId: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") ?? "") as ShopOrderStatus;
  try {
    await updateShopOrderStatus(orderId, status);
  } catch (error) {
    if (error instanceof ValidationError) {
      redirect(withError("/admin/shop/narudzbe", error.message));
    }
    throw error;
  }
  revalidatePath("/admin/shop/narudzbe");
  revalidatePath("/admin/shop");
  redirect(withToast("/admin/shop/narudzbe", "Status narudžbe je ažuriran"));
}
