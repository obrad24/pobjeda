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
const MAX_BYTES = 4 * 1024 * 1024;

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
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

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new ValidationError(
      "Upload nije konfigurisan. Unesite URL slike ili postavite BLOB_READ_WRITE_TOKEN.",
    );
  }

  const originalName = file.name?.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "foto";
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const blob = await put(`players/${Date.now()}-${originalName}`, buffer, {
      access: "public",
      token,
      addRandomSuffix: true,
      contentType: type,
    });
    return blob.url;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "";
    throw new ValidationError(
      /token|unauthorized|access|forbidden/i.test(message)
        ? "Upload nije uspio. Provjerite BLOB_READ_WRITE_TOKEN."
        : "Upload fotografije nije uspio. Pokušajte manju sliku (do 4 MB) ili unesite URL.",
    );
  }
}
