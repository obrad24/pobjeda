import { revalidateTag } from "next/cache";

export const PUBLIC_REVALIDATE_SECONDS = 60;

export const CACHE_TAGS = {
  league: "league",
  players: "players",
  stats: "stats",
  fantasy: "fantasy",
  history: "history",
  shop: "shop",
} as const;

export function revalidatePublic(...tags: Array<(typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]>) {
  const unique = tags.length > 0 ? [...new Set(tags)] : Object.values(CACHE_TAGS);
  for (const tag of unique) {
    revalidateTag(tag, "max");
  }
}
