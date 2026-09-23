/** Timecard validation models. Rules run on seeded ADP and Amazon exports. */

export type MatchMethod =
  | "exact"
  | "first-name-prefix"
  | "compound-surname"
  | "last-name-typo";

export type AmazonBreakStatus = "non_compliant" | "missing_punch";

export interface WorkBlock {
  raw: string;
  route: string;
  start: string;
  durationHours: number;
}

export interface ScheduledShift {
  raw: string;
  role: string;
  start: string | null;
  durationHours: number | null;
  unavailable: boolean;
}

export interface ScheduleDay {
  date: string;
  workBlock: WorkBlock | null;
  shift: ScheduledShift | null;
}

export interface ScheduleAssociate {
  name: string;
  transporterId: string;
  days: ScheduleDay[];
}

export interface AdpPunchRow {
  name: string;
  positionId: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: string;
  outType: string;
  payCode: string;
}

export interface IndividualDay {
  date: string;
  segments: Array<{
    timeIn: string;
    timeOut: string;
    hours: string;
    outType: string;
  }>;
}

export interface IndividualTimecard {
  name: string;
  positionId: string;
  weekTotalHours: number;
  days: IndividualDay[];
}

export interface AmazonBreakDay {
  associateName: string;
  date: string;
  status: AmazonBreakStatus;
}

export interface EvaluateInput {
  weekDates: string[];
  coverageDates: string[];
  associates: ScheduleAssociate[];
  punches: AdpPunchRow[];
  individuals: IndividualTimecard[];
  breaks: AmazonBreakDay[];
  sourceNotes: string[];
  /** Used in unmatched-ADP reasons. Defaults to Week 39 for existing callers. */
  rosterWeekLabel?: string;
}

export interface ExceptionRow {
  id: string;
  associate: string;
  adpName: string;
  transporterId: string;
  positionId: string;
  date: string;
  dateLabel: string;
  amazonTimes: string;
  adpTimes: string;
  hoursLabel: string;
  rule: string;
  matchMethod: MatchMethod | null;
  searchText: string;
}

export interface MealRow extends ExceptionRow {
  mismatch: boolean;
  amazonStatus: string;
  adpMeal: string;
}

export interface UnmatchedRow {
  id: string;
  name: string;
  secondary: string;
  detail: string;
  reason: string;
  searchText: string;
  dateKeys: string[];
}

export interface Over60Peak {
  associate: string;
  adpName: string;
  hoursLabel: string;
  windowLabel: string;
  coverageLabel: string;
}

export interface Over60Window {
  label: string;
  coverageLabel: string;
}

export interface BreaksSummary {
  dasWithViolations: number;
  dasWithViolationsYesterday: number | null;
  missingBreaks: number;
  delayedBreaks: number;
  shorterBreakThanRequired: number;
  packageDeliveredDuringBreak: number;
  missingPunches: number;
  breaksBoardAssociates: number;
}

export interface WorkHoursSummary {
  dasNearingViolations: number | null;
  worked50to60HoursPast7Days: number | null;
  worked5to6ConsecutiveDays: number | null;
  associateNamed: boolean;
  lastRefreshedDate: string;
}

export interface ComplianceReport {
  week: number;
  weekLabel: string;
  company: string;
  station: string;
  exportedAt: string;
  coverageLabel: string;
  /** Short line under the captured-days tile. */
  coverageDetail: string;
  /** Sentence in the source banner after the shared ADP/Amazon lead-in. */
  sourceNote: string;
  coverageDates: string[];
  weekDates: string[];
  dateLabels: Array<{ date: string; label: string }>;
  counts: {
    missingPunchDays: number;
    missingPunchAssociates: number;
    over12Days: number;
    over60Associates: number;
    mealMismatches: number;
    mealRowsJoined: number;
  };
  missingPunches: ExceptionRow[];
  over12: ExceptionRow[];
  over60: ExceptionRow[];
  over60Peak: Over60Peak | null;
  over60Windows: Over60Window[];
  mealRows: MealRow[];
  unmatchedAmazon: UnmatchedRow[];
  unmatchedAdp: UnmatchedRow[];
  notes: string[];
  breaksSummary: BreaksSummary;
  workHoursSummary: WorkHoursSummary;
  scheduleTemplateNote: string;
}
