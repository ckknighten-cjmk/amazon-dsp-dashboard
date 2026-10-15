/** Open vehicle issues from Amazon DSP Console → Fleet Management → Issues. */

export const INSPECTION_DEFECT = "Inspection defects";

/** Shown separately. These never count as inspection damage. */
export const OTHER_ISSUE_TYPES = [
  "Self reported maintenance",
  "Preventative maintenance",
  "Vehicle safety signals",
  "Odometer defects",
] as const;

export type OtherIssueType = (typeof OTHER_ISSUE_TYPES)[number];

export type InspectionSource = "AVI" | "DVIC pre-trip" | "DVIC post-trip";

export interface FleetIssueDetail {
  detailUrl: string;
  sourceInspection: InspectionSource;
  /** ISO timestamp in America/Chicago for the inspection that found the defect. */
  foundAt: string;
  /** Finder published on the vehicle page, such as AVI SCANNER. */
  inspector: string | null;
  photos: string;
  comments: string;
  /** Driver DVIC lines from the vehicle page, unchanged. */
  otherInspectionsToday: string;
  preTripPassed: boolean | null;
  postTripPassed: boolean | null;
  damageFoundAfterDriverChecksPassed: boolean;
}

export interface FleetIssue {
  rowId: number;
  vehicleName: string;
  plate: string;
  makeModel: string;
  vin: string;
  /** ISO timestamp in America/Chicago. */
  createdAt: string;
  issueType: string;
  component: string;
  side: string | null;
  description: string;
  severity: string;
  repairStatus: string;
  repairNote: string | null;
  operationalStatus: string;
  ownershipStatus: string;
  detail?: FleetIssueDetail;
}

export interface FleetIssueSnapshot {
  /** Calendar date from the snapshot filename, YYYY-MM-DD. */
  date: string;
  capturedAt: string;
  /** America/Chicago calendar day of `capturedAt`. */
  captureDay: string;
  station: string;
  source: string;
  totalResultsShown: string;
  issues: FleetIssue[];
}

export interface FleetIssueCatalog {
  /** Snapshot dates, oldest first. */
  dates: string[];
  newest: FleetIssueSnapshot | null;
  /** The dated snapshot immediately before `newest`, when one exists. */
  previous: FleetIssueSnapshot | null;
}
