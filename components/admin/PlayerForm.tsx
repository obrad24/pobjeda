"use client";

import Link from "next/link";
import { useState } from "react";
import { POSITIONS } from "@/lib/format";
import { parseFormerClubs } from "@/lib/players/former-clubs";
import { PendingButton } from "./PendingButton";

export function PlayerForm({
  action,
  error,
  defaults,
  blobConfigured,
}: {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  blobConfigured: boolean;
  defaults?: {
    firstName: string;
    lastName: string;
    birthYear: number | null;
    jerseyNumber: number | null;
    position: string;
    image: string | null;
    formerClubs: string | null;
    active: boolean;
  };
}) {
  const [preview, setPreview] = useState<string | null>(defaults?.image ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const initialClubs = parseFormerClubs(defaults?.formerClubs);
  const [clubs, setClubs] = useState<string[]>(initialClubs.length > 0 ? initialClubs : [""]);

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="max-w-xl space-y-4 rounded-xl border border-navy/10 bg-white p-6"
    >
      {error ? <p className="text-sm text-red">{error}</p> : null}
      {photoError ? <p className="text-sm text-red">{photoError}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Ime
          <input
            name="firstName"
            required
            defaultValue={defaults?.firstName}
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Prezime
          <input
            name="lastName"
            required
            defaultValue={defaults?.lastName}
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Godište
          <input
            name="birthYear"
            type="number"
            defaultValue={defaults?.birthYear ?? ""}
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Broj dresa
          <input
            name="jerseyNumber"
            type="number"
            min={1}
            max={99}
            defaultValue={defaults?.jerseyNumber ?? ""}
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Pozicija
          <select
            name="position"
            defaultValue={defaults?.position ?? "MF"}
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
          >
            {POSITIONS.map((position) => (
              <option key={position.id} value={position.id}>
                {position.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Fotografija (URL)
          <input
            name="image"
            defaultValue={defaults?.image ?? ""}
            placeholder="https://… ili /uploads/…"
            className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2"
            onChange={(event) => {
              if (!event.target.value) {
                return;
              }
              setPreview(event.target.value);
            }}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Upload fotografije
          <input
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-1 w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setPhotoError(null);
                return;
              }
              if (file.size > 4 * 1024 * 1024) {
                event.target.value = "";
                setPhotoError("Fotografija smije biti najviše 4 MB");
                setPreview(defaults?.image ?? null);
                return;
              }
              setPhotoError(null);
              setPreview(URL.createObjectURL(file));
            }}
          />
          <span className="mt-1 block text-xs text-muted">
            {blobConfigured
              ? "JPEG, PNG, WebP ili GIF, do 4 MB. Upload ima prednost nad URL-om."
              : "Na Vercel-u treba BLOB_READ_WRITE_TOKEN. Do tada unesite URL slike."}
          </span>
        </label>
        {preview ? (
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs text-muted">Pregled</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Pregled fotografije" className="h-40 w-40 rounded-lg object-cover" />
          </div>
        ) : (
          <p className="text-sm text-muted sm:col-span-2">Nema fotografije — na javnom sajtu ostaje placeholder s brojem.</p>
        )}
        <div className="space-y-2 text-sm sm:col-span-2">
          <p>Bivši klubovi</p>
          {clubs.map((club, index) => (
            <div key={index} className="flex gap-2">
              <input
                name="formerClub"
                value={club}
                placeholder="Naziv kluba"
                className="w-full rounded-md border border-navy/20 px-3 py-2"
                onChange={(event) => {
                  const next = [...clubs];
                  next[index] = event.target.value;
                  setClubs(next);
                }}
              />
              <button
                type="button"
                className="shrink-0 text-sm text-red"
                onClick={() => setClubs(clubs.length > 1 ? clubs.filter((_, i) => i !== index) : [""])}
              >
                Ukloni
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-navy hover:text-gold-dark"
            onClick={() => setClubs([...clubs, ""])}
          >
            Dodaj klub
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} />
        Aktivan
      </label>
      <div className="flex gap-3">
        <PendingButton
          pendingLabel="Čuvam…"
          className="rounded-full bg-navy px-5 py-2 text-sm text-gold disabled:opacity-60"
        >
          Sačuvaj
        </PendingButton>
        <Link href="/admin/igraci" className="py-2 text-sm text-muted">
          Odustani
        </Link>
      </div>
    </form>
  );
}
