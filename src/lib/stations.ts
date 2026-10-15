/**
 * Station catalog for CJMK Ops. Add a station here before wiring its seeds.
 * DNA4 is the live Memphis station. WTN2 is opening soon and has no capture yet.
 */

export const STATIONS = [
  { code: "DNA4", displayName: "DNA4", region: "Memphis" },
  { code: "WTN2", displayName: "WTN2", region: "West Tennessee" },
] as const;

export type StationCode = (typeof STATIONS)[number]["code"];

export type StationProfile = (typeof STATIONS)[number];

export const DEFAULT_STATION_CODE: StationCode = "DNA4";

export const STATION_QUERY = "station";

/** Cookie and localStorage key. Both survive navigation and Refresh. */
export const STATION_COOKIE = "cjmk-ops-station";

export const STATION_STORAGE_KEY = "cjmk-ops-station";

/** Request header set by proxy so server components see the URL or cookie station. */
export const STATION_HEADER = "x-cjmk-station";

export const NO_CAPTURE_LABEL = "No capture yet";

const STATION_CODE_SET = new Set<string>(STATIONS.map((station) => station.code));

export function isStationCode(value: string | null | undefined): value is StationCode {
  return typeof value === "string" && STATION_CODE_SET.has(value.trim().toUpperCase());
}

/** Unknown or blank values are not a station. Callers fall back to DNA4. */
export function parseStationParam(value: string | null | undefined): StationCode | null {
  if (value == null) return null;
  const code = value.trim().toUpperCase();
  if (!code || !STATION_CODE_SET.has(code)) return null;
  return code as StationCode;
}

export function stationProfile(code: StationCode): StationProfile {
  const profile = STATIONS.find((station) => station.code === code);
  if (!profile) return STATIONS[0];
  return profile;
}

/**
 * URL wins, then the cookie, then localStorage, then DNA4.
 * An invalid value is skipped so a bad query does not hide a saved station.
 */
export function resolveStation(input: {
  query?: string | null;
  cookie?: string | null;
  storage?: string | null;
}): StationCode {
  return (
    parseStationParam(input.query) ??
    parseStationParam(input.cookie) ??
    parseStationParam(input.storage) ??
    DEFAULT_STATION_CODE
  );
}

export function stationEmptyTitle(code: StationCode) {
  return `No data for ${code} yet`;
}

export function hrefWithStation(href: string, station: StationCode) {
  const hashIndex = href.indexOf("#");
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf("?");
  const path = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
  const params = new URLSearchParams(queryIndex === -1 ? "" : withoutHash.slice(queryIndex + 1));
  params.set(STATION_QUERY, station);
  const serialized = params.toString();
  return `${serialized ? `${path}?${serialized}` : path}${hash}`;
}

export function stationCookieHeader(code: StationCode) {
  return `${STATION_COOKIE}=${code}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function readStationCookieValue(cookieHeader: string | null | undefined): StationCode | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (!part.startsWith(`${STATION_COOKIE}=`)) continue;
    return parseStationParam(decodeURIComponent(part.slice(STATION_COOKIE.length + 1)));
  }
  return null;
}
