import { cookies, headers } from "next/headers";
import {
  DEFAULT_STATION_CODE,
  parseStationParam,
  STATION_COOKIE,
  STATION_HEADER,
  type StationCode,
} from "@/lib/stations";

function first(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Query, then the proxy header (query or cookie), then the cookie, then DNA4. */
export async function currentStation(query?: string | string[] | null): Promise<StationCode> {
  const fromQuery = parseStationParam(first(query));
  if (fromQuery) return fromQuery;
  const headerStore = await headers();
  const fromHeader = parseStationParam(headerStore.get(STATION_HEADER));
  if (fromHeader) return fromHeader;
  const cookieStore = await cookies();
  return parseStationParam(cookieStore.get(STATION_COOKIE)?.value) ?? DEFAULT_STATION_CODE;
}
