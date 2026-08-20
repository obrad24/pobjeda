export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseMoney(value: unknown): number | null {
  const text = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!text) {
    return null;
  }
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return roundMoney(parsed);
}

export function salePrice(price: number, discountPercent: number | null | undefined): number {
  if (!discountPercent || discountPercent <= 0) {
    return roundMoney(price);
  }
  return roundMoney(price * (1 - discountPercent / 100));
}
