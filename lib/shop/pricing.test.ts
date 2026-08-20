import { describe, expect, it } from "vitest";
import { parseMoney, roundMoney, salePrice } from "./pricing";

describe("shop pricing", () => {
  it("parses comma decimals", () => {
    expect(parseMoney("25,50")).toBe(25.5);
    expect(parseMoney(" 10 ")).toBe(10);
  });

  it("applies percent discount", () => {
    expect(salePrice(50, 20)).toBe(40);
    expect(salePrice(99.99, 10)).toBe(89.99);
    expect(salePrice(30, null)).toBe(30);
  });

  it("rounds to two decimals", () => {
    expect(roundMoney(19.999)).toBe(20);
    expect(salePrice(10, 33)).toBe(6.7);
  });
});
