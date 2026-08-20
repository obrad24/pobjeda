"use client";

import { useActionState } from "react";
import { createShopOrderAction, type OrderActionState } from "@/app/(site)/shop/actions";
import { PendingButton } from "@/components/admin/PendingButton";
import { formatPriceKm } from "@/lib/format";
import type { ShopProductCard } from "@/lib/shop";

export function OrderDialog({
  product,
  onClose,
}: {
  product: ShopProductCard;
  onClose: () => void;
}) {
  const [state, action] = useActionState<OrderActionState, FormData>(createShopOrderAction, null);
  const image = product.image1 ?? product.image2;

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center p-3 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Zatvori" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-order-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#120c32] p-5 shadow-2xl sm:p-6"
      >
        {state?.ok ? (
          <div className="space-y-4 py-4 text-center">
            <p id="shop-order-title" className="font-display text-2xl text-white">
              Narudžba je poslana
            </p>
            <p className="text-sm text-white/60">
              Hvala. Kontaktiraćemo vas radi potvrde i načina preuzimanja ili dostave.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy-dark"
            >
              Zatvori
            </button>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div className="flex gap-3">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : null}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-light">Narudžba</p>
                <h2 id="shop-order-title" className="font-display text-2xl text-white">
                  {product.name}
                </h2>
                <p className="text-sm text-gold">{formatPriceKm(product.salePrice)}</p>
              </div>
            </div>
            {state && !state.ok ? <p className="rounded-md bg-red/20 px-3 py-2 text-sm text-red">{state.error}</p> : null}
            <input type="hidden" name="productId" value={product.id} />
            <p className="hidden" aria-hidden>
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-white/80">
                Ime
                <input
                  name="firstName"
                  required
                  autoComplete="given-name"
                  className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm text-white/80">
                Prezime
                <input
                  name="lastName"
                  required
                  autoComplete="family-name"
                  className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm text-white/80">
                Telefon
                <input
                  name="phone"
                  required
                  type="tel"
                  autoComplete="tel"
                  className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm text-white/80">
                Email
                <input
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm text-white/80 sm:col-span-2">
                Adresa
                <textarea
                  name="address"
                  required
                  rows={3}
                  autoComplete="street-address"
                  className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm text-white/80">
                Količina
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={1}
                  className="mt-1 w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white"
                />
              </label>
            </div>
            <p className="text-xs text-white/45">
              Plaćanje po dogovoru. Nakon slanja vas kontaktiramo na telefon ili email.
            </p>
            <div className="flex flex-wrap gap-3">
              <PendingButton
                pendingLabel="Šaljem…"
                className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-dark disabled:opacity-60"
              >
                Pošalji narudžbu
              </PendingButton>
              <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-white/60 hover:text-white">
                Odustani
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
