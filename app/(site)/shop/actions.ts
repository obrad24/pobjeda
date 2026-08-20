"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { actionFailureMessage } from "@/lib/errors";
import { createShopOrder } from "@/lib/shop";

export type OrderActionState = { ok: true } | { ok: false; error: string } | null;

export async function createShopOrderAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  if (String(formData.get("website") ?? "").trim()) {
    return { ok: true };
  }

  try {
    await createShopOrder({
      productId: String(formData.get("productId") ?? ""),
      quantity: Number(formData.get("quantity") ?? 1),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      address: String(formData.get("address") ?? ""),
    });
    revalidatePath("/admin/shop/narudzbe");
    revalidatePath("/admin/shop");
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    console.error("createShopOrderAction", error);
    return { ok: false, error: actionFailureMessage(error, "Narudžba nije poslana. Pokušajte ponovo.") };
  }
}
