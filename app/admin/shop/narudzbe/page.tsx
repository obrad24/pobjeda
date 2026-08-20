import Link from "next/link";
import { PendingButton } from "@/components/admin/PendingButton";
import { EmptyState } from "@/components/ui/Section";
import { formatDateTime, formatPriceKm } from "@/lib/format";
import { getShopOrders } from "@/lib/shop";
import { updateShopOrderStatusAction } from "../actions";

const STATUS_LABEL = {
  NEW: "Nova",
  DONE: "Završena",
  CANCELLED: "Otkazana",
} as const;

export default async function AdminShopOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const orders = await getShopOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-navy">Narudžbe</h1>
          <p className="mt-1 text-sm text-muted">Kupci ostavljaju podatke kroz popup na /shop.</p>
        </div>
        <Link href="/admin/shop" className="text-sm text-navy hover:text-gold-dark">
          ← Proizvodi
        </Link>
      </div>
      {error ? <p className="rounded-md bg-red/10 px-3 py-2 text-sm text-red">{error}</p> : null}

      {orders.length === 0 ? (
        <EmptyState title="Nema narudžbi" body="Kada neko pošalje narudžbu sa shop stranice, pojaviće se ovdje." />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const update = updateShopOrderStatusAction.bind(null, order.id);
            return (
              <li key={order.id} className="rounded-xl border border-navy/10 bg-white p-5 text-navy">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl">{order.productName}</p>
                    <p className="text-sm text-muted">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status === "NEW"
                        ? "bg-gold/20 text-navy"
                        : order.status === "DONE"
                          ? "bg-green-100 text-green-800"
                          : "bg-navy/5 text-muted"
                    }`}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Kupac</dt>
                    <dd>
                      {order.firstName} {order.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Telefon</dt>
                    <dd>
                      <a href={`tel:${order.phone.replace(/\s/g, "")}`} className="hover:underline">
                        {order.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Email</dt>
                    <dd>
                      <a href={`mailto:${order.email}`} className="hover:underline">
                        {order.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Adresa</dt>
                    <dd>{order.address}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Količina</dt>
                    <dd>
                      {order.quantity} × {formatPriceKm(order.unitPrice)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Ukupno</dt>
                    <dd className="font-semibold">{formatPriceKm(order.totalPrice)}</dd>
                  </div>
                </dl>
                <form action={update} className="mt-4 flex flex-wrap items-center gap-2">
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="rounded-md border border-navy/20 px-3 py-2 text-sm"
                  >
                    <option value="NEW">Nova</option>
                    <option value="DONE">Završena</option>
                    <option value="CANCELLED">Otkazana</option>
                  </select>
                  <PendingButton
                    pendingLabel="Čuvam…"
                    className="rounded-full bg-navy px-4 py-2 text-sm text-gold disabled:opacity-60"
                  >
                    Ažuriraj status
                  </PendingButton>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
