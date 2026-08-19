const RETRYABLE =
  /ETIMEDOUT|ECONNRESET|ECONNREFUSED|EPIPE|EAI_AGAIN|ENOTFOUND|Connection terminated|timeout exceeded|Client has encountered a connection error|Can't reach database server|57P01|57P02|57P03/i;

export function runtimeConnectionString(raw: string): string {
  const url = new URL(raw);

  // node-pg + Neon pooler: channel binding can stall the TLS handshake from some networks.
  url.searchParams.delete("channel_binding");

  // pg currently aliases require/prefer/verify-ca to verify-full and warns.
  // Pin verify-full so the handshake stays the same after pg v9.
  const sslmode = url.searchParams.get("sslmode");
  if (!sslmode || sslmode === "require" || sslmode === "prefer" || sslmode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }

  if (!url.searchParams.get("connect_timeout")) {
    url.searchParams.set("connect_timeout", "15");
  }

  return url.toString();
}

export function isRetryableDbError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const code = typeof error === "object" && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && error.cause instanceof Error ? error.cause.message : "";

  return RETRYABLE.test(`${code} ${message} ${cause}`);
}

export async function withDbRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableDbError(error) || attempt === attempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** (attempt - 1)));
    }
  }

  throw lastError;
}
