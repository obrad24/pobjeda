import type { z } from "zod";
import { ValidationError } from "../errors";

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, fallbackMessage = "Neispravni podaci"): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  const issue = result.error.issues[0];
  const path = issue?.path.filter((part) => part !== undefined && part !== "").join(".") ?? "";
  const detail = issue ? `${path ? `${path}: ` : ""}${issue.message}` : fallbackMessage;
  throw new ValidationError(detail, result.error.issues);
}
