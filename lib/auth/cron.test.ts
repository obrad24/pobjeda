import { describe, expect, it } from "vitest";
import { authorizeCronRequest } from "./cron";

function requestWithBearer(token?: string) {
  const headers = new Headers();
  if (token !== undefined) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return new Request("http://localhost/api/cron/sportdc-sync", { headers });
}

describe("authorizeCronRequest", () => {
  it("rejects a missing secret", () => {
    expect(authorizeCronRequest(requestWithBearer("abc"), "")).toBe(false);
  });

  it("rejects a missing bearer token", () => {
    expect(authorizeCronRequest(requestWithBearer(), "super-secret")).toBe(false);
  });

  it("rejects a wrong token", () => {
    expect(authorizeCronRequest(requestWithBearer("nope"), "super-secret")).toBe(false);
  });

  it("accepts the matching bearer token", () => {
    expect(authorizeCronRequest(requestWithBearer("super-secret"), "super-secret")).toBe(true);
  });
});
