import type { FleetIssue, FleetIssueDetail, FleetIssueSnapshot, InspectionSource } from "@/lib/fleet-issues/types";
import { parseStationDateTime, stationCalendarDay } from "@/lib/fleet-issues/time";

export interface RawFleetIssueRow {
  rowId: number;
  Vehicle: string;
  "Created date & time": string;
  "Operational status": string;
  "Issue type": string;
  "Category and description": string;
  Severity: string;
  "Repair status": string;
  "Ownership status": string;
}

export interface RawNewDefectDetail {
  vehicle: string;
  detailUrl: string;
  issue: string;
  severity: string;
  sourceAndDateCreated: string;
  status: string;
  inspection: string;
  photos: string;
  comments: string;
  otherInspectionsToday: string;
}

export interface RawFleetIssueCapture {
  capturedAt: string;
  station: string;
  source: string;
  totalResultsShown?: string;
  rows: RawFleetIssueRow[];
  newDefectDetails?: RawNewDefectDetail[];
}

const VIN = /\b[A-HJ-NPR-Z0-9]{17}\b/;

export function blankLineParts(value: string) {
  return value
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseVehicleCell(value: string, rowId: number) {
  const parts = blankLineParts(value);
  if (parts.length === 4 && VIN.test(parts[3])) {
    return {
      vehicleName: parts[0],
      plate: parts[1],
      makeModel: parts[2],
      vin: parts[3],
    };
  }
  if (parts.length === 3 && VIN.test(parts[2]) && parts[1].includes(",")) {
    return {
      vehicleName: "",
      plate: parts[0],
      makeModel: parts[1],
      vin: parts[2],
    };
  }
  throw new Error(`Row ${rowId} has an unrecognized Vehicle cell`);
}

export function parseCategoryCell(value: string, rowId: number) {
  const parts = blankLineParts(value);
  if (parts.length === 3) {
    return { component: parts[0], side: parts[1], description: parts[2] };
  }
  if (parts.length === 2) {
    return { component: parts[0], side: null, description: parts[1] };
  }
  throw new Error(`Row ${rowId} has an unrecognized Category and description cell`);
}

export function parseRepairStatus(value: string) {
  const parts = blankLineParts(value);
  return {
    repairStatus: parts[0] ?? "",
    repairNote: parts.length > 1 ? parts.slice(1).join("\n") : null,
  };
}

export function parseInspectionSource(
  sourceAndDateCreated: string,
  inspection: string
): InspectionSource | null {
  const labeled = sourceLabel(sourceAndDateCreated) ?? sourceLabel(inspection);
  return labeled;
}

export interface DriverCheckAssessment {
  preTripPassed: boolean | null;
  postTripPassed: boolean | null;
  damageFoundAfterDriverChecksPassed: boolean;
}

/**
 * A same-day driver check counts only when the vehicle page names DVIC pre-trip
 * or post-trip and a Passed or Failed result. The flag is set when both of
 * those checks passed.
 */
export function assessDriverChecks(otherInspectionsToday: string): DriverCheckAssessment {
  const check = /DVIC:\s*(Pre-trip|Post-trip)\s+(\d{1,2}:\d{2}\s*[AP]M)\s+(.+?)\s+(Passed|Failed)\b/gi;
  const pre: boolean[] = [];
  const post: boolean[] = [];
  for (const match of otherInspectionsToday.matchAll(check)) {
    const passed = match[4].toLowerCase() === "passed";
    const phase = match[1].toLowerCase();
    if (phase === "pre-trip") pre.push(passed);
    if (phase === "post-trip") post.push(passed);
  }
  const preTripPassed = phaseResult(pre);
  const postTripPassed = phaseResult(post);
  return {
    preTripPassed,
    postTripPassed,
    damageFoundAfterDriverChecksPassed: preTripPassed === true && postTripPassed === true,
  };
}

export function parseDefectDetail(detail: RawNewDefectDetail): FleetIssueDetail {
  const sourceInspection = parseInspectionSource(detail.sourceAndDateCreated, detail.inspection);
  if (!sourceInspection) {
    throw new Error(`Unrecognized inspection source for ${detail.vehicle}`);
  }
  const foundAt = parseStationDateTime(detail.inspection);
  const checks = assessDriverChecks(detail.otherInspectionsToday);
  return {
    detailUrl: detail.detailUrl,
    sourceInspection,
    foundAt,
    inspector: inspectionInspector(detail.inspection),
    photos: detail.photos,
    comments: detail.comments,
    otherInspectionsToday: detail.otherInspectionsToday,
    ...checks,
  };
}

export function parseFleetIssueCapture(
  raw: RawFleetIssueCapture,
  options: { date: string }
): FleetIssueSnapshot {
  const details = new Map<string, FleetIssueDetail>();
  for (const detail of raw.newDefectDetails ?? []) {
    const vin = detail.vehicle.match(VIN)?.[0];
    if (!vin) throw new Error(`Detail has no VIN: ${detail.vehicle}`);
    details.set(detailKey(vin, detail.issue), parseDefectDetail(detail));
  }

  const used = new Set<string>();
  const issues = raw.rows.map((row) => {
    const vehicle = parseVehicleCell(row.Vehicle, row.rowId);
    const category = parseCategoryCell(row["Category and description"], row.rowId);
    const repair = parseRepairStatus(row["Repair status"]);
    const key = detailKey(vehicle.vin, issuePath(category));
    const detail = details.get(key);
    if (detail) used.add(key);
    const issue: FleetIssue = {
      rowId: row.rowId,
      ...vehicle,
      createdAt: parseStationDateTime(row["Created date & time"]),
      issueType: row["Issue type"],
      ...category,
      severity: row.Severity,
      ...repair,
      operationalStatus: row["Operational status"],
      ownershipStatus: row["Ownership status"],
    };
    if (detail) issue.detail = detail;
    return issue;
  });

  for (const key of details.keys()) {
    if (!used.has(key)) throw new Error(`Detail did not match an issues row: ${key}`);
  }

  return {
    date: options.date,
    capturedAt: raw.capturedAt,
    captureDay: stationCalendarDay(raw.capturedAt),
    station: raw.station,
    source: raw.source,
    totalResultsShown: raw.totalResultsShown ?? "",
    issues,
  };
}

function sourceLabel(value: string): InspectionSource | null {
  const text = value.trim();
  if (/^AVI\b/i.test(text)) return "AVI";
  if (/^DVIC\b/i.test(text)) return dvicPhase(text);
  if (/(?:^|,\s*)AVI\b/.test(text) && !/DVIC/i.test(text)) return "AVI";
  return dvicPhase(text);
}

function dvicPhase(value: string): InspectionSource | null {
  if (!/DVIC/i.test(value)) return null;
  if (/pre[-\s]?trip/i.test(value)) return "DVIC pre-trip";
  if (/post[-\s]?trip/i.test(value)) return "DVIC post-trip";
  return null;
}

function phaseResult(results: boolean[]) {
  if (results.length === 0) return null;
  return results.every(Boolean);
}

function inspectionInspector(inspection: string) {
  const comma = inspection.indexOf(",");
  if (comma === -1) return null;
  const fields = inspection
    .slice(comma + 1)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return fields[1] ?? null;
}

function issuePath(category: { component: string; side: string | null; description: string }) {
  return [category.component, category.side, category.description].filter((part) => part).join(" / ");
}

function detailKey(vin: string, issue: string) {
  return `${vin}\u0000${issue.trim()}`;
}
