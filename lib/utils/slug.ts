const CHAR_MAP: Record<string, string> = {
  đ: "d",
  Đ: "d",
  č: "c",
  Č: "c",
  ć: "c",
  Ć: "c",
  š: "s",
  Š: "s",
  ž: "z",
  Ž: "z",
};

export function slugifyName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
    .split("")
    .map((char) => CHAR_MAP[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
