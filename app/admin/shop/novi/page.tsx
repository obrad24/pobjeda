import { ShopProductForm } from "@/components/admin/ShopProductForm";
import { isBlobConfigured } from "@/lib/uploads/player-photo";
import { createShopProductAction } from "../actions";

export default async function NewShopProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-navy">Novi proizvod</h1>
      <ShopProductForm action={createShopProductAction} error={error} blobConfigured={isBlobConfigured()} />
    </div>
  );
}
