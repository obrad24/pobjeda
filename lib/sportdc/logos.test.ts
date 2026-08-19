import { describe, expect, it } from "vitest";
import { sportdcClubLogoUrl } from "./teams";

describe("sportdcClubLogoUrl", () => {
  it("builds the SportDC club crest URL from team id", () => {
    expect(sportdcClubLogoUrl(8448)).toBe("https://sportdc.net/img/club/8448");
    expect(sportdcClubLogoUrl(7594)).toBe("https://sportdc.net/img/club/7594");
  });
});
