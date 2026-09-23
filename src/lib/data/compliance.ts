/**
 * Timecard validation for CJMK Inc. / DNA4.
 * ADP punches are the Group Timecard capture. Amazon blocks and shifts are
 * parsed from the DSP Console weekly schedule workbook.
 */
import adpWeek38 from "@/lib/data/seed/adp-timecards-week38.json";
import adpWeek39 from "@/lib/data/seed/adp-timecards-week39.json";
import breaksWeek38 from "@/lib/data/seed/week38-amazon-breaks.json";
import breaksWeek39 from "@/lib/data/seed/week39-amazon-breaks.json";
import scheduleWeek38 from "@/lib/data/seed/week38-amazon-schedule.json";
import scheduleWeek39 from "@/lib/data/seed/week39-amazon-schedule.json";
import { dateLabel, evaluateTimecards } from "@/lib/compliance/engine";
import type {
  AdpPunchRow,
  AmazonBreakStatus,
  BreaksSummary,
  ComplianceReport,
  IndividualTimecard,
  ScheduleAssociate,
  WorkHoursSummary,
} from "@/lib/compliance/types";

export const COMPLIANCE_WEEKS = [38, 39] as const;
export type ComplianceWeek = (typeof COMPLIANCE_WEEKS)[number];

const SCHEDULE_TEMPLATE_NOTE =
  "Coming later. This build does not load or push the Amazon weekly schedule into ADP schedule templates.";

const BREAK_STATUSES = new Set<AmazonBreakStatus>(["non_compliant", "missing_punch"]);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface AdpSeed {
  notes: string[];
  groupTimecard: Record<
    string,
    Array<{
      name: string;
      positionId: string;
      timeIn: string;
      timeOut: string;
      hours: string;
      outType: string;
      payCode: string;
    }>
  >;
  individualTimecards: Record<
    string,
    {
      positionId: string;
      weekTotalHours: string | number;
      days: Array<{
        date: string;
        segments: Array<{
          timeIn: string;
          timeOut: string;
          hours: string;
          outType: string;
        }>;
      }>;
    }
  >;
}

interface BreaksSeed {
  summary: BreaksSummary;
  workHours: WorkHoursSummary & { source: string };
  rows: Array<{ associateName: string; date: string; status: string }>;
  limits: string[];
}

interface ScheduleSeed {
  company: string;
  station: string;
  exportedAt: string;
  rosteredTotals: Record<string, number>;
  scheduledTotals: Record<string, number>;
  associates: Array<{
    name: string;
    transporterId: string;
    days: Array<{
      date: string;
      workBlock: {
        raw: string;
        route: string;
        start: string;
        durationHours: number;
      } | null;
      shift: {
        raw: string;
        role: string;
        start: string | null;
        durationHours: number | null;
        unavailable: boolean;
      } | null;
    }>;
  }>;
}

interface WeekCopy {
  sourceNote: string;
  coverageDetail: string;
  adpPreface: string[];
  outsideCoverageNote: string | null;
}

const WEEK_COPY: Record<ComplianceWeek, WeekCopy> = {
  38: {
    sourceNote:
      "Punches are the read-only Group Timecard for Sun–Sat. No individual Timecard Detail views were captured.",
    coverageDetail: "Group Timecard · Sun–Sat",
    adpPreface: [],
    outsideCoverageNote: null,
  },
  39: {
    sourceNote:
      "The Timecard Detail Report export failed (ORA-20005), so punches are from the Group Timecard grid.",
    coverageDetail: "Group Timecard · Sep 22 grid was blank",
    adpPreface: [
      "ADP Timecard Detail Report export failed (ORA-20005). Punches are the read-only Group Timecard grid, plus individual timecard views opened for Zora Bobo, Brandon Clark, and Chance Stupp.",
    ],
    outsideCoverageNote:
      "Sep 22–26 are outside missing-punch flags. The Group Timecard capture has Sep 20 and Sep 21 only. Sep 22 was opened and the visible rows were blank.",
  },
};

const SEEDS: Record<ComplianceWeek, { adp: AdpSeed; breaks: BreaksSeed; schedule: ScheduleSeed }> = {
  38: {
    adp: adpWeek38 as AdpSeed,
    breaks: breaksWeek38 as BreaksSeed,
    schedule: scheduleWeek38 as ScheduleSeed,
  },
  39: {
    adp: adpWeek39 as AdpSeed,
    breaks: breaksWeek39 as BreaksSeed,
    schedule: scheduleWeek39 as ScheduleSeed,
  },
};

function asBreakStatus(value: string): AmazonBreakStatus {
  if (BREAK_STATUSES.has(value as AmazonBreakStatus)) return value as AmazonBreakStatus;
  throw new Error(`Unexpected Amazon break status: ${value}`);
}

function whole(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function shortDate(iso: string) {
  const [, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

function spanLabel(start: string, end: string) {
  const first = shortDate(start);
  const last = shortDate(end);
  return first === last ? first : `${first}–${last}`;
}

function workHoursNote(work: BreaksSeed["workHours"]) {
  const nearing = work.dasNearingViolations;
  const pastSeven = work.worked50to60HoursPast7Days;
  const consecutive = work.worked5to6ConsecutiveDays;
  if (nearing == null || pastSeven == null || consecutive == null) {
    return `${work.source}, last refreshed ${work.lastRefreshedDate}. DA nearing-violation, 50–60 hour, and 5–6 consecutive-day counts were not in this capture.`;
  }
  const named = work.associateNamed
    ? "The capture names that associate."
    : "The screenshot does not name that associate.";
  return `${work.source}, last refreshed ${work.lastRefreshedDate}: ${nearing} DA nearing violations. Worked 50–60 hours in the past 7 days: ${pastSeven}. Worked 5–6 consecutive days: ${consecutive}. ${named}`;
}

function buildReport(week: ComplianceWeek): ComplianceReport {
  const { adp, breaks, schedule } = SEEDS[week];
  const copy = WEEK_COPY[week];
  const weekDates = schedule.associates[0]?.days.map((day) => day.date) ?? [];
  const coverageDates = Object.keys(adp.groupTimecard).sort();
  const punches: AdpPunchRow[] = [];
  for (const [date, rows] of Object.entries(adp.groupTimecard)) {
    for (const row of rows) {
      punches.push({
        name: row.name,
        positionId: row.positionId,
        date,
        timeIn: row.timeIn,
        timeOut: row.timeOut,
        hours: row.hours,
        outType: row.outType,
        payCode: row.payCode,
      });
    }
  }

  const individuals: IndividualTimecard[] = Object.entries(adp.individualTimecards).map(
    ([name, card]) => ({
      name,
      positionId: card.positionId,
      weekTotalHours: Number(card.weekTotalHours),
      days: card.days.map((day) => ({
        date: day.date,
        segments: day.segments.map((segment) => ({
          timeIn: segment.timeIn,
          timeOut: segment.timeOut,
          hours: segment.hours,
          outType: segment.outType,
        })),
      })),
    })
  );

  const associates: ScheduleAssociate[] = schedule.associates.map((associate) => ({
    name: associate.name,
    transporterId: associate.transporterId,
    days: associate.days.map((day) => ({
      date: day.date,
      workBlock: day.workBlock
        ? {
            raw: day.workBlock.raw,
            route: day.workBlock.route,
            start: day.workBlock.start,
            durationHours: day.workBlock.durationHours,
          }
        : null,
      shift: day.shift
        ? {
            raw: day.shift.raw,
            role: day.shift.role,
            start: day.shift.start,
            durationHours: day.shift.durationHours,
            unavailable: day.shift.unavailable,
          }
        : null,
    })),
  }));

  const evaluation = evaluateTimecards({
    weekDates,
    coverageDates,
    associates,
    punches,
    individuals,
    breaks: breaks.rows.map((row) => ({
      associateName: row.associateName,
      date: row.date,
      status: asBreakStatus(row.status),
    })),
    rosterWeekLabel: `Week ${week}`,
    sourceNotes: [...copy.adpPreface, ...adp.notes],
  });

  const rostered = weekDates.map((date) => whole(schedule.rosteredTotals[date])).join(", ");
  const scheduled = weekDates.map((date) => whole(schedule.scheduledTotals[date])).join(", ");
  const work = breaks.workHours;
  const start = weekDates[0] ?? coverageDates[0] ?? "";
  const end = weekDates[weekDates.length - 1] ?? coverageDates[coverageDates.length - 1] ?? "";

  const notes = [
    ...evaluation.notes,
    `Rostered work-block totals Sun–Sat from the schedule workbook: ${rostered}. Scheduled-shift totals: ${scheduled}.`,
    ...breaks.limits,
    workHoursNote(work),
  ];
  if (copy.outsideCoverageNote) notes.push(copy.outsideCoverageNote);
  if (breaks.rows.length === 0) {
    notes.push(
      "No per-DA Compliance Breaks rows were in this capture, so meal mismatches are not scored."
    );
  }

  const missingAssociates = new Set(evaluation.missingPunches.map((row) => row.associate));
  const over60Associates = new Set(evaluation.over60.map((row) => row.adpName));

  return {
    week,
    weekLabel: `Week ${week}, ${spanLabel(start, end)}, ${start.slice(0, 4)}`,
    company: schedule.company,
    station: schedule.station,
    exportedAt: schedule.exportedAt,
    coverageLabel: coverageDates.length ? spanLabel(coverageDates[0], coverageDates[coverageDates.length - 1]) : "No Group Timecard days",
    coverageDetail: copy.coverageDetail,
    sourceNote: copy.sourceNote,
    coverageDates,
    weekDates,
    dateLabels: weekDates.map((date) => ({ date, label: dateLabel(date) })),
    counts: {
      missingPunchDays: evaluation.missingPunches.length,
      missingPunchAssociates: missingAssociates.size,
      over12Days: evaluation.over12.length,
      over60Associates: over60Associates.size,
      mealMismatches: evaluation.mealRows.filter((row) => row.mismatch).length,
      mealRowsJoined: evaluation.mealRows.length,
    },
    missingPunches: evaluation.missingPunches,
    over12: evaluation.over12,
    over60: evaluation.over60,
    over60Peak: evaluation.over60Peak,
    over60Windows: evaluation.over60Windows,
    mealRows: evaluation.mealRows,
    unmatchedAmazon: evaluation.unmatchedAmazon,
    unmatchedAdp: evaluation.unmatchedAdp,
    notes,
    breaksSummary: breaks.summary,
    workHoursSummary: {
      dasNearingViolations: work.dasNearingViolations,
      worked50to60HoursPast7Days: work.worked50to60HoursPast7Days,
      worked5to6ConsecutiveDays: work.worked5to6ConsecutiveDays,
      associateNamed: work.associateNamed,
      lastRefreshedDate: work.lastRefreshedDate,
    },
    scheduleTemplateNote: SCHEDULE_TEMPLATE_NOTE,
  };
}

const cached = new Map<ComplianceWeek, ComplianceReport>();

export function parseComplianceWeek(value: string | string[] | undefined): ComplianceWeek {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "39" ? 39 : 38;
}

export function getComplianceReport(week: ComplianceWeek = 38) {
  const existing = cached.get(week);
  if (existing) return existing;
  const report = buildReport(week);
  cached.set(week, report);
  return report;
}
