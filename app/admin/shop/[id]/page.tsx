import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { ShopProductForm } from "@/components/admin/ShopProductForm";
import { orNotFound } from "@/lib/not-found";
import { getShopProduct } from "@/lib/shop";
import { isBlobConfigured } from "@/lib/uploads/player-photo";
import { deleteShopProductAction, updateShopProductAction } from "../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditShopProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  let product;
  try {
    product = await getShopProduct(id);
  } catch (caught) {
    orNotFound(caught);
  }

  const update = updateShopProductAction.bind(null, product.id);
  const remove = deleteShopProductAction.bind(null, product.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-navy">{product.name}</h1>
        <p className="text-sm text-muted">{product.active ? "Objavljeno" : "Skica"} · /shop</p>
      </div>
      <ShopProductForm action={update} error={error} defaults={product} blobConfigured={isBlobConfigured()} />
      <ConfirmSubmit action={remove} message="Trajno obrisati proizvod? Ovo se ne može poništiti.">
        <button type="submit" className="text-sm text-red hover:underline">
          Obriši proizvod
        </button>
      </ConfirmSubmit>
    </div>
  );
}
