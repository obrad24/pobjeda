export function parseFormerClubs(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((club) => club.trim())
    .filter(Boolean);
}

export function joinFormerClubs(clubs: string[]): string | null {
  const cleaned = clubs.map((club) => club.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(", ") : null;
}
