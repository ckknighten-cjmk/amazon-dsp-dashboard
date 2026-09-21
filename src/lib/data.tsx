/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { seedDb } from "../data/seed";
import type { SeedDatabase } from "../types/database";
import { filterDatabase } from "./aggregations";
import { getSupabase } from "./supabase";
import { useAuth } from "./auth";

interface DataContextValue {
  db: SeedDatabase;
  filtered: SeedDatabase;
  stationId: string | "all";
  setStationId: (id: string | "all") => void;
  source: "demo" | "supabase";
  loading: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

async function loadFromSupabase(): Promise<SeedDatabase | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const tables = [
    "stations",
    "drivers",
    "vehicles",
    "routes",
    "rescues",
    "failed_deliveries",
    "attendance",
    "safety_events",
    "vehicle_inspections",
    "incidents",
    "coaching_recommendations",
    "financial_daily",
    "scorecards",
    "forecasts",
    "route_hourly_stats",
  ] as const;
  const results = await Promise.all(tables.map((table) => sb.from(table).select("*")));
  if (results.some((result) => result.error)) return null;
  const [
    stations,
    drivers,
    vehicles,
    routes,
    rescues,
    failedDeliveries,
    attendance,
    safetyEvents,
    inspections,
    incidents,
    coaching,
    financialDaily,
    scorecards,
    forecasts,
    hourly,
  ] = results.map((result) => result.data ?? []);
  if (!stations.length) return null;
  return {
    stations,
    drivers,
    vehicles,
    routes,
    rescues,
    failedDeliveries,
    attendance,
    safetyEvents,
    inspections,
    incidents,
    coaching,
    financialDaily,
    scorecards,
    forecasts,
    hourlyProgress: (hourly as Array<{ hour_label: string; planned: number; delivered: number }>).map((row) => ({
      hour: row.hour_label,
      planned: row.planned,
      delivered: row.delivered,
    })),
  } as SeedDatabase;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [db, setDb] = useState<SeedDatabase>(seedDb);
  const [source, setSource] = useState<"demo" | "supabase">("demo");
  const [loading, setLoading] = useState(false);
  const [stationId, setStationId] = useState<string | "all">(user?.stationId ?? "all");

  useEffect(() => {
    setStationId(user?.stationId ?? "all");
  }, [user?.stationId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadFromSupabase()
      .then((remote) => {
        if (cancelled || !remote) return;
        setDb(remote);
        setSource("supabase");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => filterDatabase(db, stationId, user), [db, stationId, user]);

  const value = useMemo(
    () => ({ db, filtered, stationId, setStationId, source, loading }),
    [db, filtered, stationId, source, loading],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
