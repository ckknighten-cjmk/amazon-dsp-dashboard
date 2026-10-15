import seed from "@/lib/data/seed/dvic-2026-10-14.json";
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
type SeedCounts = {
  dvicPreTrip?: unknown;
  dvicPostTrip?: unknown;
  aviPostTrip?: unknown;
};

/** Either DVIC capture. `counts` is optional so the Sep 23 file stays valid. */
export type DvicSeed = {
  source: string;
  station: string;
  date: string;
  preTrip?: unknown;
  postTrip?: unknown;
  aviPostTrip?: unknown;
  counts?: SeedCounts;
  note?: string;
  newDamageComparisonFields?: string;
  navPath?: readonly string[];
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

function listedCount(rows: unknown) {
  return Array.isArray(rows) ? rows.length : 0;
}

/** Dashboard total used only when that phase published no inspection rows. */
function phaseTotal(rows: unknown, published: unknown) {
  const listed = listedCount(rows);
  if (listed > 0) return listed;
  if (typeof published === "number" && Number.isInteger(published) && published >= 0) return published;
  return listed;
}

export interface DvicReport extends DvicCapture {
  pairs: DvicDayPair[];
  newDamage: NewDamageAlert[];
}

export function dvicReportFromSeed(seedFile: DvicSeed): DvicReport {
  const serviceDate = seedFile.date;
  const rows = [
    ...phaseRows("pre_trip", seedFile.preTrip, serviceDate),
    ...phaseRows("post_trip", seedFile.postTrip, serviceDate),
    ...phaseRows("avi_post_trip", seedFile.aviPostTrip, serviceDate),
  ];
  const nav =
    seedFile.navPath?.[0] ?? "Administration → Fleet → Dashboard → Today's vehicle inspections";
  const disclaimer = [seedFile.note, seedFile.newDamageComparisonFields].filter(Boolean).join(" ");
  const counts = seedFile.counts;
  return {
    source: seedFile.source,
    nav,
    stationCode: stationCode(seedFile.station),
    company: seedFile.station,
    serviceDate,
    totals: {
      preTrip: phaseTotal(seedFile.preTrip, counts?.dvicPreTrip),
      postTrip: phaseTotal(seedFile.postTrip, counts?.dvicPostTrip),
      aviPostTrip: phaseTotal(seedFile.aviPostTrip, counts?.aviPostTrip),
    },
    inspections: rows,
    disclaimer,
    pairs: pairInspections(rows),
    newDamage: findNewDamage(rows),
  };
}

export function getDvicReport(): DvicReport {
  return dvicReportFromSeed(seed);
}
