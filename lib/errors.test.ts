import { describe, expect, it } from "vitest";
import { publicErrorMessage } from "./errors";

describe("publicErrorMessage", () => {
  it("hides database connectivity failures", () => {
    expect(publicErrorMessage(new Error("ETIMEDOUT: Invalid prisma.user.findUnique()"))).toBe(
      "Veza sa bazom nije uspjela. Sačekajte par sekundi i pokušajte ponovo.",
    );
    expect(publicErrorMessage(new Error("{clientVersion: \"7.9.1\"}"))).toContain("Veza sa bazom");
  });

  it("keeps validation messages", () => {
    expect(publicErrorMessage(new Error("Broj 7 je već zauzet"))).toBe("Broj 7 je već zauzet");
  });
});
