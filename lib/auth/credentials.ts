import { z } from "zod";

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return "";
}

/** People often paste ADMIN_PASSWORD from .env including the quotes. */
export function stripCopiedQuotes(value: string): string {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export const credentialsSchema = z.object({
  email: z.preprocess((value) => asString(value).trim().toLowerCase(), z.string().email().max(120)),
  password: z.preprocess((value) => stripCopiedQuotes(asString(value)), z.string().min(1).max(200)),
});
