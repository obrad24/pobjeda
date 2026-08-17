export function withToast(path: string, message: string): string {
  const url = new URL(path, "http://pobjeda.local");
  url.searchParams.set("toast", message);
  return `${url.pathname}${url.search}`;
}

export function withError(path: string, message: string): string {
  const url = new URL(path, "http://pobjeda.local");
  url.searchParams.set("error", message);
  return `${url.pathname}${url.search}`;
}
