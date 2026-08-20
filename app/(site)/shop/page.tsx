import type { Metadata } from "next";
import { ShopCatalog } from "@/components/shop/ShopCatalog";
import { Container, EmptyState, PageHeader } from "@/components/ui/Section";
import { getCachedShopProducts } from "@/lib/site-data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop",
  description: "Klupski shop FK Pobjeda Triješnica — dresovi i suveniri, narudžba na klik.",
};

export default async function ShopPage() {
  const products = await getCachedShopProducts();

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        eyebrow="Klupska prodavnica"
        title="Shop"
        description="Odaberite proizvod, ostavite podatke i kontaktiraćemo vas radi potvrde narudžbe."
      />
      {products.length === 0 ? (
        <EmptyState
          title="Shop se priprema"
          body="Proizvodi će se pojaviti ovdje nakon što ih klub doda u adminu."
        />
      ) : (
        <ShopCatalog products={products} />
      )}
    </Container>
  );
}
