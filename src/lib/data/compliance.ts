/**
 * Week 39 timecard validation for CJMK Inc. / DNA4.
 * ADP punches are the Group Timecard capture. Amazon blocks and shifts are
 * parsed from the DSP Console weekly schedule workbook.
 */
import adpSeed from "@/lib/data/seed/adp-timecards-week39.json";
import breaksSeed from "@/lib/data/seed/week39-amazon-breaks.json";
import scheduleSeed from "@/lib/data/seed/week39-amazon-schedule.json";
import { dateLabel, evaluateTimecards } from "@/lib/compliance/engine";
import type {
  AdpPunchRow,
  AmazonBreakStatus,
  ComplianceReport,
  IndividualTimecard,
  ScheduleAssociate,
} from "@/lib/compliance/types";

const SCHEDULE_TEMPLATE_NOTE =
  "Coming later. This build does not load or push the Amazon weekly schedule into ADP schedule templates.";

const BREAK_STATUSES = new Set<AmazonBreakStatus>(["non_compliant", "missing_punch"]);

function asBreakStatus(value: string): AmazonBreakStatus {
  if (BREAK_STATUSES.has(value as AmazonBreakStatus)) return value as AmazonBreakStatus;
  throw new Error(`Unexpected Amazon break status: ${value}`);
}

function whole(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function buildReport(): ComplianceReport {
  const weekDates = scheduleSeed.associates[0]?.days.map((day) => day.date) ?? [];
  const coverageDates = Object.keys(adpSeed.groupTimecard).sort();
  const punches: AdpPunchRow[] = [];
  for (const [date, rows] of Object.entries(adpSeed.groupTimecard)) {
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

  const individuals: IndividualTimecard[] = Object.entries(adpSeed.individualTimecards).map(
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

  const associates: ScheduleAssociate[] = scheduleSeed.associates.map((associate) => ({
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
    breaks: breaksSeed.rows.map((row) => ({
      associateName: row.associateName,
      date: row.date,
      status: asBreakStatus(row.status),
    })),
    sourceNotes: [
      "ADP Timecard Detail Report export failed (ORA-20005). Punches are the read-only Group Timecard grid, plus individual timecard views opened for Zora Bobo, Brandon Clark, and Chance Stupp.",
      ...adpSeed.notes,
    ],
  });

  const rostered = weekDates.map((date) => whole(scheduleSeed.rosteredTotals[date as keyof typeof scheduleSeed.rosteredTotals])).join(", ");
  const scheduled = weekDates
    .map((date) => whole(scheduleSeed.scheduledTotals[date as keyof typeof scheduleSeed.scheduledTotals]))
    .join(", ");
  const work = breaksSeed.workHours;

  const notes = [
    ...evaluation.notes,
    `Rostered work-block totals Sun–Sat from the schedule workbook: ${rostered}. Scheduled-shift totals: ${scheduled}.`,
    ...breaksSeed.limits,
    `${work.source}, last refreshed ${work.lastRefreshedDate}: ${work.dasNearingViolations} DA nearing violations. Worked 50–60 hours in the past 7 days: ${work.worked50to60HoursPast7Days}. Worked 5–6 consecutive days: ${work.worked5to6ConsecutiveDays}. The screenshot does not name that associate.`,
    "Sep 22–26 are outside missing-punch flags. The Group Timecard capture has Sep 20 and Sep 21 only. Sep 22 was opened and the visible rows were blank.",
  ];

  const missingAssociates = new Set(evaluation.missingPunches.map((row) => row.associate));
  const over60Associates = new Set(evaluation.over60.map((row) => row.adpName));

  return {
    weekLabel: "Week 39, Sep 20–Sep 26, 2026",
    company: scheduleSeed.company,
    station: scheduleSeed.station,
    exportedAt: scheduleSeed.exportedAt,
    coverageLabel: "Sep 20–Sep 21",
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
    breaksSummary: breaksSeed.summary,
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

let cached: ComplianceReport | null = null;

export function getComplianceReport() {
  if (!cached) cached = buildReport();
  return cached;
}
