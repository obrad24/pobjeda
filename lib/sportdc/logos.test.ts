import { describe, expect, it } from "vitest";
import { OUR_CLUB_DISPLAY_NAME, OUR_CLUB_LOGO } from "./types";
import { crestSrcForTeam, logoUrlForTeam, sportdcClubLogoUrl } from "./teams";

describe("sportdcClubLogoUrl", () => {
  it("builds the SportDC club crest URL from team id", () => {
    expect(sportdcClubLogoUrl(8448)).toBe("https://sportdc.net/img/club/8448");
    expect(sportdcClubLogoUrl(7594)).toBe("https://sportdc.net/img/club/7594");
  });
});

describe("logoUrlForTeam", () => {
  it("uses the local anniversary crest for FK Pobjeda", () => {
    expect(
      logoUrlForTeam({ sportdcTeamId: 8448, sportdcName: "Pobjeda", city: "Triješnica" }),
    ).toBe(OUR_CLUB_LOGO);
    expect(logoUrlForTeam({ sportdcTeamId: 7594, sportdcName: "Tavna", city: "Banjica" })).toBe(
      "https://sportdc.net/img/club/7594",
    );
  });
});

describe("crestSrcForTeam", () => {
  it("replaces SportDC Pobjeda crests with the local anniversary crest", () => {
    expect(crestSrcForTeam(OUR_CLUB_DISPLAY_NAME, "https://sportdc.net/img/club/8448")).toBe(OUR_CLUB_LOGO);
    expect(crestSrcForTeam("FK Tavna Banjica", "https://sportdc.net/img/club/7594")).toBe(
      "https://sportdc.net/img/club/7594",
    );
  });
});
