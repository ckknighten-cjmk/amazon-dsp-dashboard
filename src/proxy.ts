import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_STATION_CODE,
  parseStationParam,
  STATION_COOKIE,
  STATION_HEADER,
  STATION_QUERY,
} from "@/lib/stations";

/**
 * Copy the station onto the request so server pages match the URL.
 * A `station` query updates the cookie. A missing query keeps the cookie.
 */
export function proxy(request: NextRequest) {
  const fromQuery = parseStationParam(request.nextUrl.searchParams.get(STATION_QUERY));
  const fromCookie = parseStationParam(request.cookies.get(STATION_COOKIE)?.value);
  const station = fromQuery ?? fromCookie ?? DEFAULT_STATION_CODE;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(STATION_HEADER, station);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (fromQuery && fromQuery !== fromCookie) {
    response.cookies.set(STATION_COOKIE, fromQuery, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
