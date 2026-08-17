import { createHash, timingSafeEqual } from "node:crypto";

export function authorizeCronRequest(
  request: Request,
  secret = process.env.CRON_SECRET,
): boolean {
  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const actual = createHash("sha256").update(token).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(actual, expected);
}
