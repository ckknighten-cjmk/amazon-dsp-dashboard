import {
  INSPECTION_DEFECT,
  OTHER_ISSUE_TYPES,
  type FleetIssue,
  type FleetIssueCatalog,
  type FleetIssueSnapshot,
  type OtherIssueType,
} from "@/lib/fleet-issues/types";
import { stationCalendarDay } from "@/lib/fleet-issues/time";

export const DRIVER_CHECKS_PASSED_FLAG = "Damage found after driver checks passed";

export function isInspectionDefect(issue: { issueType: string }) {
  return issue.issueType === INSPECTION_DEFECT;
}

export function isOtherIssueType(issueType: string): issueType is OtherIssueType {
  return (OTHER_ISSUE_TYPES as readonly string[]).includes(issueType);
}

/** Identity used to tell a later snapshot from the previous one. */
export function issueMatchKey(issue: Pick<FleetIssue, "vin" | "component" | "side" | "description" | "createdAt">) {
  return [issue.vin, issue.component, issue.side ?? "", issue.description, issue.createdAt].join("\u0000");
}

export function defectText(issue: Pick<FleetIssue, "component" | "side" | "description">) {
  return [issue.component, issue.side, issue.description].filter((part) => part).join(" · ");
}

export function issuesCreatedOnDay(issues: readonly FleetIssue[], day: string) {
  return issues.filter((issue) => stationCalendarDay(issue.createdAt) === day);
}

export interface SnapshotDiff {
  comparable: boolean;
  issues: FleetIssue[];
}

/** Issues in `current` whose match key is absent from `previous`. */
export function issuesAbsentFromPrevious(
  current: readonly FleetIssue[],
  previous: readonly FleetIssue[] | null
): SnapshotDiff {
  if (previous == null) return { comparable: false, issues: [] };
  const seen = new Set(previous.map((issue) => issueMatchKey(issue)));
  return {
    comparable: true,
    issues: current.filter((issue) => !seen.has(issueMatchKey(issue))),
  };
}

export interface IssueBuckets {
  damage: FleetIssue[];
  other: Record<OtherIssueType, FleetIssue[]>;
  unclassified: FleetIssue[];
}

export function partitionIssues(issues: readonly FleetIssue[]): IssueBuckets {
  const other = emptyOther();
  const damage: FleetIssue[] = [];
  const unclassified: FleetIssue[] = [];
  for (const issue of issues) {
    if (isInspectionDefect(issue)) damage.push(issue);
    else if (isOtherIssueType(issue.issueType)) other[issue.issueType].push(issue);
    else unclassified.push(issue);
  }
  return { damage, other, unclassified };
}

export interface FleetIssueDayReport {
  day: string;
  comparable: boolean;
  previousDate: string | null;
  created: IssueBuckets;
  /** Inspection defects in the newest snapshot that the previous snapshot did not list. */
  diffDamage: FleetIssue[];
  diffOther: Record<OtherIssueType, FleetIssue[]>;
}

export function buildFleetIssueDayReport(input: {
  current: readonly FleetIssue[];
  previous: readonly FleetIssue[] | null;
  previousDate?: string | null;
  day: string;
}): FleetIssueDayReport {
  const created = partitionIssues(issuesCreatedOnDay(input.current, input.day));
  const diff = issuesAbsentFromPrevious(input.current, input.previous);
  const diffBuckets = partitionIssues(diff.issues);
  return {
    day: input.day,
    comparable: diff.comparable,
    previousDate: input.previousDate ?? null,
    created,
    diffDamage: diff.comparable ? diffBuckets.damage : [],
    diffOther: diff.comparable ? diffBuckets.other : emptyOther(),
  };
}

export function vehicleHasNewDamage(
  vehicle: { vin?: string | null; plate?: string | null },
  damage: readonly Pick<FleetIssue, "vin" | "plate">[]
) {
  const vin = vehicle.vin?.trim();
  if (vin) return damage.some((issue) => issue.vin === vin);
  const plate = vehicle.plate?.trim();
  if (!plate) return false;
  return damage.some((issue) => issue.plate === plate);
}

export function orderSnapshots(snapshots: readonly FleetIssueSnapshot[]) {
  return [...snapshots].sort((left, right) => left.date.localeCompare(right.date));
}

export function selectCatalog(snapshots: readonly FleetIssueSnapshot[]): FleetIssueCatalog {
  const ordered = orderSnapshots(snapshots);
  const dates = ordered.map((snapshot) => snapshot.date);
  if (new Set(dates).size !== dates.length) {
    throw new Error("Fleet issue snapshots include more than one file for the same date");
  }
  return {
    dates,
    newest: ordered.at(-1) ?? null,
    previous: ordered.length >= 2 ? ordered[ordered.length - 2] : null,
  };
}

export function driverCheckNote(issue: FleetIssue) {
  const detail = issue.detail;
  if (!detail) return "";
  if (!detail.damageFoundAfterDriverChecksPassed) return detail.otherInspectionsToday;
  const raw = detail.otherInspectionsToday.trim();
  return raw ? `${raw} ${DRIVER_CHECKS_PASSED_FLAG}.` : `${DRIVER_CHECKS_PASSED_FLAG}.`;
}

function emptyOther(): Record<OtherIssueType, FleetIssue[]> {
  return {
    "Self reported maintenance": [],
    "Preventative maintenance": [],
    "Vehicle safety signals": [],
    "Odometer defects": [],
  };
}
