import { describe, expect, it } from "vitest";
import { stripHtmlTags } from "./text";

describe("stripHtmlTags", () => {
  it("removes tags and script blocks", () => {
    expect(stripHtmlTags("<p>1976</p>")).toBe("1976");
    expect(stripHtmlTags('<script>alert(1)</script>osnivanje')).toBe("osnivanje");
  });
});
