import seed from "@/lib/data/seed/dvic-2026-09-23.json";
import { findNewDamage, pairInspections } from "@/lib/dvic/compare";
import type { DvicCapture, DvicDamage, DvicDayPair, DvicInspection, DvicPhase, NewDamageAlert } from "@/lib/dvic/types";

type SeedDamage = { area?: unknown; detail?: unknown; description?: unknown };
type SeedRow = {
  id?: unknown;
  vehicleUnit?: unknown;
  unit?: unknown;
  vehicle?: unknown;
  serviceDate?: unknown;
  date?: unknown;
  damage?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function damageItems(value: unknown): DvicDamage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as SeedDamage;
    const area = text(row.area);
    const detail = text(row.detail) || text(row.description);
    if (!area && !detail) return [];
    return [{ area, detail }];
  });
}

function phaseRows(phase: DvicPhase, value: unknown, serviceDate: string): DvicInspection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as SeedRow;
    const id = text(row.id) || `${phase}-${index + 1}`;
    const vehicleUnit = text(row.vehicleUnit) || text(row.unit) || text(row.vehicle);
    return [
      {
        id,
        vehicleUnit,
        serviceDate: text(row.serviceDate) || text(row.date) || serviceDate,
        phase,
        damage: damageItems(row.damage),
      },
    ];
  });
}

function stationCode(station: string) {
  const match = station.match(/\bDNA4\b/);
  return match?.[0] ?? station;
}

export interface DvicReport extends DvicCapture {
  pairs: DvicDayPair[];
  newDamage: NewDamageAlert[];
}

export function getDvicReport(): DvicReport {
  const serviceDate = seed.date;
  const rows = [
    ...phaseRows("pre_trip", seed.preTrip, serviceDate),
    ...phaseRows("post_trip", seed.postTrip, serviceDate),
    ...phaseRows("avi_post_trip", seed.aviPostTrip, serviceDate),
  ];
  const nav = seed.navPath[0] ?? "Administration → Fleet → Dashboard → Today's vehicle inspections";
  const disclaimer = [seed.note, seed.newDamageComparisonFields].filter(Boolean).join(" ");
  return {
    source: seed.source,
    nav,
    stationCode: stationCode(seed.station),
    company: seed.station,
    serviceDate,
    totals: {
      preTrip: seed.preTrip.length,
      postTrip: seed.postTrip.length,
      aviPostTrip: seed.aviPostTrip.length,
    },
    inspections: rows,
    disclaimer,
    pairs: pairInspections(rows),
    newDamage: findNewDamage(rows),
  };
}
