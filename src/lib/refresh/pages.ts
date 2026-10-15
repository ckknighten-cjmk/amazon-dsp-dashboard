/** Page keys accepted by POST /api/refresh. Settings uses overview. Route detail uses routes. */
export const REFRESH_PAGE_KEYS = [
  "overview",
  "routes",
  "drivers",
  "fleet",
  "scorecard",
  "payments",
  "compliance",
  "bonus",
  "incidents",
] as const;

export type RefreshPageKey = (typeof REFRESH_PAGE_KEYS)[number];

const PAGE_KEY_SET = new Set<string>(REFRESH_PAGE_KEYS);

export function isRefreshPageKey(value: string): value is RefreshPageKey {
  return PAGE_KEY_SET.has(value);
}

/** Map a dashboard pathname to the webhook page key. */
export function refreshPageKey(pathname: string): RefreshPageKey {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (path.startsWith("/routes")) return "routes";
  if (path.startsWith("/drivers")) return "drivers";
  if (path.startsWith("/fleet")) return "fleet";
  if (path.startsWith("/scorecard")) return "scorecard";
  if (path.startsWith("/payments")) return "payments";
  if (path.startsWith("/compliance")) return "compliance";
  if (path.startsWith("/bonus")) return "bonus";
  if (path.startsWith("/incidents")) return "incidents";
  return "overview";
}
