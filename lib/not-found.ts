import { notFound } from "next/navigation";
import { NotFoundError, ValidationError } from "./errors";

export function orNotFound(error: unknown): never {
  if (error instanceof NotFoundError || error instanceof ValidationError) {
    notFound();
  }
  throw error;
}
