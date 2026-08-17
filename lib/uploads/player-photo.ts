import { put } from "@vercel/blob";
import { ValidationError } from "../errors";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 4 * 1024 * 1024;

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadPlayerPhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
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

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "foto";
  const blob = await put(`players/${Date.now()}-${safeName}`, file, {
    access: "public",
    token,
    addRandomSuffix: true,
    contentType: file.type,
  });

  return blob.url;
}
