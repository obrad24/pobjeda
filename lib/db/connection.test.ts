import { describe, expect, it } from "vitest";
import { isRetryableDbError, runtimeConnectionString } from "./connection";

describe("runtimeConnectionString", () => {
  it("strips Neon channel_binding and pins sslmode=verify-full", () => {
    const url = runtimeConnectionString(
      "postgresql://user:pass@host-pooler.neon.tech/db?sslmode=require&channel_binding=require",
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get("channel_binding")).toBeNull();
    expect(parsed.searchParams.get("sslmode")).toBe("verify-full");
    expect(parsed.searchParams.get("connect_timeout")).toBe("15");
  });
});

describe("isRetryableDbError", () => {
  it("retries timeouts and dropped connections", () => {
    expect(isRetryableDbError(Object.assign(new Error("connect"), { code: "ETIMEDOUT" }))).toBe(true);
    expect(isRetryableDbError(new Error("Connection terminated unexpectedly"))).toBe(true);
    expect(isRetryableDbError(new Error("Unique constraint failed"))).toBe(false);
  });
});
