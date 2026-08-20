import Link from "next/link";
import { EmptyState } from "@/components/ui/Section";
import { formatPriceKm } from "@/lib/format";
import { countNewShopOrders, getShopProducts } from "@/lib/shop";

export default async function AdminShopPage() {
  const [products, newOrders] = await Promise.all([getShopProducts(true), countNewShopOrders()]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-navy">Shop</h1>
          <p className="mt-1 text-sm text-muted">Proizvodi se prikazuju na /shop. Narudžbe stižu u admin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/shop/narudzbe"
            className="rounded-full border border-navy/20 px-4 py-2 text-center text-sm text-navy"
          >
            Narudžbe{newOrders > 0 ? ` (${newOrders})` : ""}
          </Link>
          <Link href="/admin/shop/novi" className="rounded-full bg-navy px-4 py-2 text-center text-sm text-gold">
            Dodaj proizvod
          </Link>
        </div>
      </div>
      {products.length === 0 ? (
        <EmptyState title="Nema proizvoda" body="Dodajte prvi proizvod da bi shop bio vidljiv na sajtu." />
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/shop/${product.id}`}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-navy/10 bg-white p-3 text-navy shadow-sm"
                >
                  {product.image1 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image1} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-xs text-muted">
                      —
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{product.name}</span>
                    <span className="block text-xs text-muted">
                      {product.discountPercent
                        ? `${formatPriceKm(product.salePrice)} · -${product.discountPercent}%`
                        : formatPriceKm(product.price)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      product.active ? "bg-green-100 text-green-800" : "bg-navy/5 text-muted"
                    }`}
                  >
                    {product.active ? "Objavljeno" : "Skica"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-xl border border-navy/10 bg-white md:block">
            <table className="w-full text-sm text-navy">
              <thead className="bg-navy text-left text-white">
                <tr>
                  <th className="px-3 py-2">Proizvod</th>
                  <th className="px-3 py-2">Cijena</th>
                  <th className="px-3 py-2">Popust</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-navy/10">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-3">
                        {product.image1 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image1} alt="" className="h-10 w-10 rounded-md object-cover" />
                        ) : null}
                        {product.name}
                      </span>
                    </td>
                    <td className="px-3 py-2">{formatPriceKm(product.salePrice)}</td>
                    <td className="px-3 py-2">{product.discountPercent ? `${product.discountPercent}%` : "—"}</td>
                    <td className="px-3 py-2">{product.active ? "objavljeno" : "skica"}</td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/admin/shop/${product.id}`} className="text-navy hover:text-gold-dark">
                        Pregled
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
