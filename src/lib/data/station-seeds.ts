import { DEFAULT_STATION_CODE, type StationCode } from "@/lib/stations";

/**
 * Pages call `loadStationDataset`. DNA4 runs the existing getter.
 * Another station stays empty until its loader is registered below.
 *
 * Put that station's first files in `src/lib/data/seed/<code lowercase>/`
 * and register one loader per dataset. See the README section "Add a station's first seed files".
 */
export const DATASET_IDS = [
  "overview",
  "scorecard",
  "bonus",
  "routes",
  "drivers",
  "fleet",
  "incidents",
  "compliance",
  "payments",
  "settings",
] as const;

export type DatasetId = (typeof DATASET_IDS)[number];

export type StationLoadArgs = {
  week?: number;
  date?: string;
};

export type StationLoader = (args?: StationLoadArgs) => unknown;

/**
 * WTN2 has no capture. Leave a dataset out until its files exist.
 * DNA4 fleet issues stay in `src/lib/data/seed/fleet-issues/`.
 * A WTN2 `fleet` loader must read `src/lib/data/seed/wtn2/fleet-issues/`
 * and return that station's catalog. The DNA4 directory is not a fallback.
 */
export const STATION_LOADERS: Partial<Record<StationCode, Partial<Record<DatasetId, StationLoader>>>> = {
  WTN2: {},
};

export function hasStationDataset(station: StationCode, dataset: DatasetId): boolean {
  if (station === DEFAULT_STATION_CODE) return true;
  return typeof STATION_LOADERS[station]?.[dataset] === "function";
}

export function loadStationDataset<T>(
  station: StationCode,
  dataset: DatasetId,
  dna4: () => T,
  args?: StationLoadArgs,
): T | null {
  if (station === DEFAULT_STATION_CODE) return dna4();
  const load = STATION_LOADERS[station]?.[dataset];
  if (!load) return null;
  return load(args) as T;
}
