import seed from "@/lib/data/seed/dvic-2026-09-23.json";
import { findNewDamage, pairInspections } from "@/lib/dvic/compare";
import type { DvicCapture, DvicDayPair, DvicInspection, DvicPhase, NewDamageAlert } from "@/lib/dvic/types";

const PHASES = new Set<DvicPhase>(["pre_trip", "post_trip", "avi_post_trip"]);

function asPhase(value: string): DvicPhase {
  if (PHASES.has(value as DvicPhase)) return value as DvicPhase;
  throw new Error(`Unexpected DVIC phase: ${value}`);
}

type SeedInspection = {
  id: string;
  vehicleUnit: string;
  serviceDate: string;
  phase: string;
  damage: Array<{ area: string; detail: string }>;
};

function inspections(): DvicInspection[] {
  const rows = seed.inspections as SeedInspection[];
  return rows.map((row) => ({
    id: row.id,
    vehicleUnit: row.vehicleUnit,
    serviceDate: row.serviceDate,
    phase: asPhase(row.phase),
    damage: row.damage.map((item) => ({ area: item.area, detail: item.detail })),
  }));
}

export interface DvicReport extends DvicCapture {
  pairs: DvicDayPair[];
  newDamage: NewDamageAlert[];
}

export function getDvicReport(): DvicReport {
  const rows = inspections();
  return {
    source: seed.source,
    nav: seed.nav,
    stationCode: seed.station.code,
    company: seed.station.dsp,
    serviceDate: seed.serviceDate,
    totals: seed.totals,
    inspections: rows,
    disclaimer: seed.disclaimer,
    pairs: pairInspections(rows),
    newDamage: findNewDamage(rows),
  };
}
