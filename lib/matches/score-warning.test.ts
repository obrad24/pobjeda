import { describe, expect, it } from "vitest";
import { formatScoreDriftWarning, ourEnteredGoalsMismatch } from "./score-warning";

const base = {
  status: "FINISHED" as const,
  homeScore: 2,
  awayScore: 1,
  homeTeamId: "us",
  awayTeamId: "them",
  goals: [{}, {}],
  lineups: [{}],
};

describe("ourEnteredGoalsMismatch", () => {
  it("warns when entered goals do not match our SportDC score", () => {
    const message = ourEnteredGoalsMismatch({ ...base, goals: [{}] }, "us");
    expect(message).toContain("2");
    expect(message).toContain("1 gol");
  });

  it("is silent when counts match", () => {
    expect(ourEnteredGoalsMismatch(base, "us")).toBeNull();
  });
});

describe("formatScoreDriftWarning", () => {
  it("names the match and both scores", () => {
    expect(formatScoreDriftWarning({ sportdcMatchId: 800001, previous: "2:1", next: "3:1" })).toContain("800001");
  });
});
