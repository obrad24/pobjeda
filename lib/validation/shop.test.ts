import { describe, expect, it } from "vitest";
import { shopOrderInputSchema, shopProductInputSchema } from "./shop";

describe("shop product validation", () => {
  it("accepts a product with optional discount", () => {
    const parsed = shopProductInputSchema.parse({
      name: "Dres",
      description: "",
      price: 45,
      discountPercent: 20,
      image1: "/uploads/shop/a.jpg",
      image2: null,
      active: true,
    });
    expect(parsed.name).toBe("Dres");
    expect(parsed.description).toBeNull();
    expect(parsed.discountPercent).toBe(20);
  });

  it("rejects a second image without the first", () => {
    const result = shopProductInputSchema.safeParse({
      name: "Šal",
      price: 15,
      image1: null,
      image2: "/uploads/shop/b.jpg",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero price", () => {
    const result = shopProductInputSchema.safeParse({ name: "Kapa", price: 0 });
    expect(result.success).toBe(false);
  });
});

describe("shop order validation", () => {
  it("accepts a complete order", () => {
    const parsed = shopOrderInputSchema.parse({
      productId: "abc123",
      quantity: 2,
      firstName: "Marko",
      lastName: "Ilić",
      phone: "065 123 456",
      email: "marko@example.com",
      address: "Triješnica bb",
    });
    expect(parsed.email).toBe("marko@example.com");
  });

  it("rejects a short address", () => {
    const result = shopOrderInputSchema.safeParse({
      productId: "abc123",
      quantity: 1,
      firstName: "Ana",
      lastName: "Petrović",
      phone: "065123456",
      email: "ana@example.com",
      address: "bb",
    });
    expect(result.success).toBe(false);
  });
});
