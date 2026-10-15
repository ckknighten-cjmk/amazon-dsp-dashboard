import { isRefreshPageKey, type RefreshPageKey } from "@/lib/refresh/pages";
import { DEFAULT_STATION_CODE, parseStationParam, type StationCode } from "@/lib/stations";

/** One fresh pull per page. A second fire inside this window is rejected. */
export const RATE_LIMIT_MS = 10 * 60 * 1000;

const DEFAULT_KEY_HEADER = "Authorization";
const HEADER_NAME = /^[A-Za-z0-9-]+$/;

export type RefreshEnv = {
  url?: string;
  key?: string;
  keyHeader?: string;
};

export type RefreshResult =
  | { status: 200; body: { ok: true; requestedAt: string } }
  | { status: 400; body: { error: "invalid_request" } }
  | { status: 429; body: { error: "rate_limited"; lastRequestedAt: string } }
  | { status: 502; body: { error: "webhook_failed" } }
  | { status: 503; body: { error: "webhook_not_configured" } };

const rateLimit = new Map<string, number>();

export function resetRefreshRateLimit() {
  rateLimit.clear();
}

export function readRefreshEnv(env: NodeJS.ProcessEnv = process.env): RefreshEnv {
  return {
    url: blankToUndefined(env.REFRESH_WEBHOOK_URL),
    key: blankToUndefined(env.REFRESH_WEBHOOK_KEY),
    keyHeader: blankToUndefined(env.REFRESH_WEBHOOK_KEY_HEADER),
  };
}

function blankToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function refreshAuthHeader(env: RefreshEnv): { name: string; value: string } | null {
  if (!env.key) return null;
  const name = env.keyHeader || DEFAULT_KEY_HEADER;
  if (!HEADER_NAME.test(name)) return null;
  const value = name.toLowerCase() === "authorization" ? `Bearer ${env.key}` : env.key;
  return { name, value };
}

type Payload = { page: RefreshPageKey; station: StationCode; week?: string; date?: string };

function readStation(value: unknown): StationCode | null {
  if (value == null || value === "") return DEFAULT_STATION_CODE;
  if (typeof value !== "string") return null;
  return parseStationParam(value);
}

export function refreshRateKey(page: string, station: string) {
  return `${station}:${page}`;
}

function readPayload(input: unknown): Payload | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  if (typeof record.page !== "string" || !isRefreshPageKey(record.page)) return null;
  const station = readStation(record.station);
  const week = optionalToken(record.week, /^\d{1,2}$/);
  const date = optionalToken(record.date, /^\d{4}-\d{2}-\d{2}$/);
  if (!station || week === null || date === null) return null;
  return {
    page: record.page,
    station,
    ...(week ? { week } : {}),
    ...(date ? { date } : {}),
  };
}

function optionalToken(value: unknown, pattern: RegExp): string | undefined | null {
  if (value == null || value === "") return undefined;
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : null;
  if (text == null || !pattern.test(text)) return null;
  return text;
}

/**
 * Forward a page refresh to the configured webhook.
 * The key is read from the server environment and is never copied into the result.
 */
export async function requestFreshData(
  input: unknown,
  options: {
    now?: number;
    env?: RefreshEnv;
    store?: Map<string, number>;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<RefreshResult> {
  const payload = readPayload(input);
  if (!payload) return { status: 400, body: { error: "invalid_request" } };

  const env = options.env ?? readRefreshEnv();
  const auth = refreshAuthHeader(env);
  if (!env.url || !env.key || !auth) {
    return { status: 503, body: { error: "webhook_not_configured" } };
  }

  const now = options.now ?? Date.now();
  const store = options.store ?? rateLimit;
  const rateKey = refreshRateKey(payload.page, payload.station);
  const last = store.get(rateKey);
  if (last != null && now - last < RATE_LIMIT_MS) {
    return {
      status: 429,
      body: { error: "rate_limited", lastRequestedAt: new Date(last).toISOString() },
    };
  }

  store.set(rateKey, now);
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(env.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [auth.name]: auth.value,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      store.delete(rateKey);
      return { status: 502, body: { error: "webhook_failed" } };
    }
  } catch {
    store.delete(rateKey);
    return { status: 502, body: { error: "webhook_failed" } };
  }

  return { status: 200, body: { ok: true, requestedAt: new Date(now).toISOString() } };
}
