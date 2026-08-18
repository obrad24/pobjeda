import { describe, expect, it } from "vitest";
import { joinFormerClubs, parseFormerClubs } from "./former-clubs";

describe("former clubs", () => {
  it("splits and trims comma-separated clubs", () => {
    expect(parseFormerClubs("Tavna,  Modran,Jedinstvo")).toEqual(["Tavna", "Modran", "Jedinstvo"]);
  });

  it("joins clubs and drops blanks", () => {
    expect(joinFormerClubs(["Tavna", " ", "Modran"])).toBe("Tavna, Modran");
    expect(joinFormerClubs(["", "  "])).toBeNull();
  });
});
