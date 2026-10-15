"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { stationSettings } from "@/lib/station-settings";
import {
  DEFAULT_STATION_CODE,
  parseStationParam,
  readStationCookieValue,
  resolveStation,
  STATION_QUERY,
  STATION_STORAGE_KEY,
  stationCookieHeader,
  stationProfile,
  type StationCode,
  type StationProfile,
} from "@/lib/stations";
import type { StationSettings } from "@/lib/types";

type StationContextValue = {
  code: StationCode;
  profile: StationProfile;
  settings: StationSettings;
  selectStation: (code: StationCode) => void;
};

const StationContext = createContext<StationContextValue | null>(null);

export function StationProvider({
  initialStation,
  children,
}: {
  initialStation: StationCode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [station, setStation] = useState<StationCode>(initialStation);

  useEffect(() => {
    setStation(initialStation);
  }, [initialStation]);

  const selectStation = useCallback(
    (next: StationCode) => {
      setStation(next);
      persistStation(next);
      const params = new URLSearchParams(window.location.search);
      params.set(STATION_QUERY, next);
      const serialized = params.toString();
      const target = serialized ? `${pathname}?${serialized}` : pathname;
      const current = `${window.location.pathname}${window.location.search}`;
      if (current !== target) router.replace(target, { scroll: false });
    },
    [pathname, router],
  );

  const value = useMemo<StationContextValue>(
    () => ({
      code: station,
      profile: stationProfile(station),
      settings: stationSettings(station),
      selectStation,
    }),
    [station, selectStation],
  );

  return (
    <StationContext.Provider value={value}>
      <Suspense fallback={null}>
        <StationUrlSync onStation={setStation} />
      </Suspense>
      {children}
    </StationContext.Provider>
  );
}

function StationUrlSync({ onStation }: { onStation: (code: StationCode) => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = params.get(STATION_QUERY);

  useEffect(() => {
    const fromUrl = parseStationParam(query);
    if (fromUrl) {
      persistStation(fromUrl);
      onStation(fromUrl);
      return;
    }
    const stored = resolveStation({
      cookie: readStationCookieValue(document.cookie),
      storage: window.localStorage.getItem(STATION_STORAGE_KEY),
    });
    persistStation(stored);
    onStation(stored);
    if (stored === DEFAULT_STATION_CODE) return;
    const next = new URLSearchParams(window.location.search);
    next.set(STATION_QUERY, stored);
    const serialized = next.toString();
    router.replace(`${pathname}?${serialized}`, { scroll: false });
  }, [onStation, pathname, query, router]);

  return null;
}

function persistStation(code: StationCode) {
  document.cookie = stationCookieHeader(code);
  try {
    window.localStorage.setItem(STATION_STORAGE_KEY, code);
  } catch {
    /* private mode */
  }
}

export function useStation() {
  const ctx = useContext(StationContext);
  if (!ctx) throw new Error("useStation must be used within StationProvider");
  return ctx;
}
