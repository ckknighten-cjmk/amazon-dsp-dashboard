"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { DateRange } from "@/lib/types";

type DateRangeContextValue = {
  range: DateRange;
  setRange: (range: DateRange) => void;
};

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [range, setRange] = useState<DateRange>("today");
  const value = useMemo(() => ({ range, setRange }), [range]);
  return (
    <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) {
    throw new Error("useDateRange must be used within DateRangeProvider");
  }
  return ctx;
}
