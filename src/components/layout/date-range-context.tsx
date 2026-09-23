"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "@/lib/types";
import {
  deserializePeriod,
  hrefWithPeriod as periodHref,
  parsePeriodParam,
  PERIOD_STORAGE_KEY,
  sameRange,
  serializePeriod,
  TODAY_RANGE,
  writePeriodParams,
} from "@/lib/period";

type DateRangeContextValue = {
  range: DateRange;
  setRange: (range: DateRange) => void;
  hrefWithPeriod: (href: string) => string;
};

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [range, setRangeState] = useState<DateRange>(TODAY_RANGE);

  const commit = useCallback(
    (next: DateRange, url: boolean) => {
      setRangeState((current) => (sameRange(current, next) ? current : next));
      window.localStorage.setItem(PERIOD_STORAGE_KEY, serializePeriod(next));
      if (!url) return;
      const params = new URLSearchParams(window.location.search);
      writePeriodParams(params, next);
      const serialized = params.toString();
      const target = serialized ? `${pathname}?${serialized}` : pathname;
      const current = `${window.location.pathname}${window.location.search}`;
      if (current !== target) router.replace(target, { scroll: false });
    },
    [pathname, router]
  );

  const setRange = useCallback((next: DateRange) => commit(next, true), [commit]);

  const value = useMemo<DateRangeContextValue>(
    () => ({
      range,
      setRange,
      hrefWithPeriod: (href: string) => periodHref(href, range),
    }),
    [range, setRange]
  );

  return (
    <DateRangeContext.Provider value={value}>
      <Suspense fallback={null}>
        <PeriodUrlSync commit={commit} />
      </Suspense>
      {children}
    </DateRangeContext.Provider>
  );
}

function PeriodUrlSync({ commit }: { commit: (range: DateRange, url: boolean) => void }) {
  const params = useSearchParams();
  const period = params.get("period");
  const start = params.get("start");
  const end = params.get("end");

  useEffect(() => {
    const fromUrl = parsePeriodParam(period, start, end);
    if (fromUrl) {
      commit(fromUrl, false);
      return;
    }
    const stored = deserializePeriod(window.localStorage.getItem(PERIOD_STORAGE_KEY));
    if (stored) commit(stored, true);
  }, [period, start, end, commit]);

  return null;
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) {
    throw new Error("useDateRange must be used within DateRangeProvider");
  }
  return ctx;
}
