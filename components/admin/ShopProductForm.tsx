"use client";

import Link from "next/link";
import { useState } from "react";
import { PendingButton } from "./PendingButton";

function ImageSlot({
  label,
  urlName,
  fileName,
  existingName,
  removeName,
  existing,
  preview,
  onPreview,
  onError,
}: {
  label: string;
  urlName: string;
  fileName: string;
  existingName: string;
  removeName: string;
  existing: string | null;
  preview: string | null;
  onPreview: (value: string | null) => void;
  onError: (value: string | null) => void;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <p className="text-sm font-medium">{label}</p>
      <input type="hidden" name={existingName} value={existing ?? ""} />
      <label className="block text-sm">
        URL
        <input
          name={urlName}
          defaultValue={existing ?? ""}
          placeholder="https://… ili /uploads/…"
          className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          onChange={(event) => {
            if (event.target.value) {
              onPreview(event.target.value);
            }
          }}
        />
      </label>
      <label className="block text-sm">
        Upload
        <input
          name={fileName}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 w-full text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              onError(null);
              return;
            }
            if (file.size > 4 * 1024 * 1024) {
              event.target.value = "";
              onError("Fotografija smije biti najviše 4 MB");
              onPreview(existing);
              return;
            }
            onError(null);
            onPreview(URL.createObjectURL(file));
          }}
        />
      </label>
      {existing ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={removeName} />
          Ukloni sliku
        </label>
      ) : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={`Pregled ${label}`} className="h-40 w-40 rounded-lg bg-navy/5 object-cover" />
      ) : null}
    </div>
  );
}

export function ShopProductForm({
  action,
  error,
  defaults,
  blobConfigured,
}: {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  blobConfigured: boolean;
  defaults?: {
    name: string;
    description: string | null;
    price: number;
    discountPercent: number | null;
    image1: string | null;
    image2: string | null;
    active: boolean;
    sortOrder: number;
  };
}) {
  const [preview1, setPreview1] = useState<string | null>(defaults?.image1 ?? null);
  const [preview2, setPreview2] = useState<string | null>(defaults?.image2 ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="max-w-xl space-y-4 rounded-xl border border-navy/10 bg-white p-6"
    >
      {error ? <p className="text-sm text-red">{error}</p> : null}
      {photoError ? <p className="text-sm text-red">{photoError}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          Naziv
          <input
            name="name"
            required
            defaultValue={defaults?.name}
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Opis (opcionalno)
          <textarea
            name="description"
            rows={3}
            defaultValue={defaults?.description ?? ""}
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Cijena (KM)
          <input
            name="price"
            type="text"
            inputMode="decimal"
            required
            defaultValue={defaults?.price ?? ""}
            placeholder="45.00"
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Popust % (ako postoji)
          <input
            name="discountPercent"
            type="number"
            min={1}
            max={99}
            defaultValue={defaults?.discountPercent ?? ""}
            placeholder="npr. 20"
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Redoslijed
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={defaults?.sortOrder ?? 0}
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <ImageSlot
          label="Slika 1"
          urlName="image1"
          fileName="photo1"
          existingName="existingImage1"
          removeName="removeImage1"
          existing={defaults?.image1 ?? null}
          preview={preview1}
          onPreview={setPreview1}
          onError={setPhotoError}
        />
        <ImageSlot
          label="Slika 2 (opcionalno)"
          urlName="image2"
          fileName="photo2"
          existingName="existingImage2"
          removeName="removeImage2"
          existing={defaults?.image2 ?? null}
          preview={preview2}
          onPreview={setPreview2}
          onError={setPhotoError}
        />
      </div>
      <p className="text-xs text-muted">
        {blobConfigured
          ? "JPEG, PNG, WebP ili GIF, do 4 MB. Upload ima prednost nad URL-om."
          : "Na Vercel-u treba BLOB_READ_WRITE_TOKEN. Do tada unesite URL slike."}
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} />
        Objavljeno u shopu
      </label>
      <div className="flex gap-3">
        <PendingButton
          pendingLabel="Čuvam…"
          className="rounded-full bg-navy px-5 py-2 text-sm text-gold disabled:opacity-60"
        >
          Sačuvaj
        </PendingButton>
        <Link href="/admin/shop" className="py-2 text-sm text-muted">
          Odustani
        </Link>
      </div>
    </form>
  );
}
