import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { ValidationError } from "../errors";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};
const TYPE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_BYTES = 4 * 1024 * 1024;
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "players");

type UploadEnv = {
  BLOB_READ_WRITE_TOKEN?: string;
  BLOB_STORE_ID?: string;
  VERCEL?: string;
};

export function isBlobConfigured(env?: UploadEnv): boolean {
  const source = env ?? {
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    BLOB_STORE_ID: process.env.BLOB_STORE_ID,
    VERCEL: process.env.VERCEL,
  };
  return hasBlobAuth(source) || !source.VERCEL;
}

function hasBlobAuth(env: UploadEnv): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID);
}

export function resolvePhotoContentType(file: { type?: string; name?: string }): string | null {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return ext ? (EXT_TYPES[ext] ?? null) : null;
}

export function isUploadedPhoto(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "arrayBuffer" in value &&
    typeof (value as File).size === "number" &&
    (value as File).size > 0 &&
    typeof (value as File).arrayBuffer === "function"
  );
}

export async function uploadPlayerPhoto(file: File): Promise<string> {
  const type = resolvePhotoContentType(file);
  if (!type) {
    throw new ValidationError("Dozvoljeni formati fotografije: JPEG, PNG, WebP i GIF");
  }
  if (file.size > MAX_BYTES) {
    throw new ValidationError("Fotografija smije biti najviše 4 MB");
  }

  const originalName = file.name?.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "foto";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (
    hasBlobAuth({
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
      BLOB_STORE_ID: process.env.BLOB_STORE_ID,
    })
  ) {
    try {
      const blob = await put(`players/${Date.now()}-${originalName}`, buffer, {
        access: "public",
        addRandomSuffix: true,
        contentType: type,
        ...(process.env.BLOB_READ_WRITE_TOKEN
          ? { token: process.env.BLOB_READ_WRITE_TOKEN }
          : {}),
      });
      return blob.url;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "";
      throw new ValidationError(
        /token|unauthorized|access|forbidden|oidc/i.test(message)
          ? "Upload nije uspio. Povežite Blob store sa Vercel projektom i redeployujte."
          : "Upload fotografije nije uspio. Pokušajte manju sliku (do 4 MB) ili unesite URL.",
      );
    }
  }

  if (process.env.VERCEL) {
    throw new ValidationError(
      "Upload nije konfigurisan. U Vercel Storage povežite pobjeda-photos sa ovim projektom (Production) i ponovo deployujte.",
    );
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const ext = TYPE_EXT[type] ?? ".jpg";
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  await writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  return `/uploads/players/${filename}`;
}
