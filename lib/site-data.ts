import { unstable_cache } from "next/cache";
import { getClubHistory } from "./history";
import { getSchedule, getStandings } from "./league";
import { getPlayers } from "./players";
import { CACHE_TAGS, PUBLIC_REVALIDATE_SECONDS } from "./query-cache";
import { getSeasonPlayerStatistics } from "./stats";

export const getCachedStandings = unstable_cache(
  () => getStandings(),
  ["public-standings"],
  { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [CACHE_TAGS.league] },
);

export const getCachedSchedule = unstable_cache(
  () => getSchedule(),
  ["public-schedule"],
  { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [CACHE_TAGS.league] },
);

export const getCachedPlayers = unstable_cache(
  () => getPlayers(),
  ["public-players"],
  { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [CACHE_TAGS.players] },
);

export const getCachedSeasonStats = unstable_cache(
  () => getSeasonPlayerStatistics(),
  ["public-stats"],
  { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [CACHE_TAGS.stats] },
);

export const getCachedHistory = unstable_cache(
  () => getClubHistory(),
  ["public-history"],
  { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [CACHE_TAGS.history] },
);
