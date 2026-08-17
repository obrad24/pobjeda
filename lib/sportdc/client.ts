const DEFAULT_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 400;
const MAX_ATTEMPTS = 3;

export const SPORTDC_USER_AGENT =
  "FKPobjedaTrijesnica/1.0 (club-website; sportdc-league-sync)";

export function getLeagueUrl(): string {
  return (
    process.env.SPORTDC_LEAGUE_URL ??
    "https://sportdc.net/league/6452-prva-opstinska-liga-bijeljina"
  );
}

export function getLeagueId(): number {
  return Number(process.env.SPORTDC_LEAGUE_ID ?? "6452");
}

export function getOurClubId(): number {
  return Number(process.env.SPORTDC_CLUB_ID ?? "8448");
}

export function roundUrl(leagueUrl: string, round: number): string {
  return `${leagueUrl.replace(/\/$/, "")}/round/${round}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchHtml(url: string): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": SPORTDC_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        cache: "no-store",
      });

      if (response.status >= 500 && attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      if (!response.ok) {
        throw new Error(`SportDC HTTP ${response.status} for ${url}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`SportDC fetch failed for ${url}`);
}

export function fetchLeaguePage(leagueUrl = getLeagueUrl()): Promise<string> {
  return fetchHtml(leagueUrl);
}

export function fetchRoundPage(
  round: number,
  leagueUrl = getLeagueUrl(),
): Promise<string> {
  return fetchHtml(roundUrl(leagueUrl, round));
}

export async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  mapper: (item: T) => Promise<R>,
  pauseMs = 150,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(mapper))));
    if (i + batchSize < items.length) {
      await sleep(pauseMs);
    }
  }

  return results;
}
