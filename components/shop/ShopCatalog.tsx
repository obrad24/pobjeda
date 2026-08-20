"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { formatPriceKm } from "@/lib/format";
import type { ShopProductCard } from "@/lib/shop";
import { OrderDialog } from "./OrderDialog";

function ProductImages({ product }: { product: ShopProductCard }) {
  const images = [product.image1, product.image2].filter((value): value is string => Boolean(value));
  const [index, setIndex] = useState(0);
  const current = images[index];

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center bg-white/5 font-display text-4xl text-gold/40">
        FK
      </div>
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden bg-navy-dark">
      <Image
        src={current}
        alt={product.name}
        width={640}
        height={640}
        className="h-full w-full object-cover"
        unoptimized={current.startsWith("http")}
      />
      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Slika ${i + 1}`}
              className={`h-2 w-2 rounded-full ${i === index ? "bg-gold" : "bg-white/40"}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: ShopProductCard;
  onAdd: (product: ShopProductCard) => void;
}) {
  const discounted = product.discountPercent != null && product.discountPercent > 0;

  return (
    <article className="glass-card overflow-hidden rounded-2xl">
      <ProductImages product={product} />
      <div className="space-y-3 p-4">
        <div>
          <h2 className="font-display text-xl text-white">{product.name}</h2>
          {product.description ? (
            <p className="mt-1 line-clamp-3 text-sm text-white/55">{product.description}</p>
          ) : null}
        </div>
        <div className="flex items-end justify-between gap-3">
          <p>
            {discounted ? (
              <>
                <span className="mr-2 text-sm text-white/40 line-through">{formatPriceKm(product.price)}</span>
                <span className="font-display text-2xl text-gold">{formatPriceKm(product.salePrice)}</span>
                <span className="ml-2 rounded-full bg-red/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  -{product.discountPercent}%
                </span>
              </>
            ) : (
              <span className="font-display text-2xl text-gold">{formatPriceKm(product.price)}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="w-full rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-navy-dark transition hover:bg-gold-light"
        >
          Dodaj u korpu
        </button>
      </div>
    </article>
  );
}

export function ShopCatalog({ products }: { products: ShopProductCard[] }) {
  const [selected, setSelected] = useState<ShopProductCard | null>(null);

  useEffect(() => {
    if (!selected) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={setSelected} />
        ))}
      </div>
      {selected ? <OrderDialog product={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
