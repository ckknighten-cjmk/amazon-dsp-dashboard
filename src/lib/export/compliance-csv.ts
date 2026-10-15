import { matchMethodLabel } from "@/lib/compliance/names";
import type { ComplianceReport, ExceptionRow, MealRow, UnmatchedRow } from "@/lib/compliance/types";
import { datasetFilename, toCsv, toSectionedCsv, withStationColumn, withStationSections } from "@/lib/export/csv";

export interface CsvFile {
  filename: string;
  csv: string;
}

function exceptionExportRows(rows: readonly ExceptionRow[]) {
  return rows.map((row) => [
    row.associate,
    row.adpName,
    row.transporterId,
    row.positionId,
    row.date,
    row.dateLabel,
    row.amazonTimes,
    row.adpTimes,
    row.hoursLabel,
    row.rule,
    row.matchMethod ? matchMethodLabel(row.matchMethod) : "",
  ]);
}

const EXCEPTION_HEADERS = [
  "Associate",
  "ADP name",
  "Transporter ID",
  "Position ID",
  "Date",
  "Date label",
  "Amazon times",
  "ADP times",
  "Hours",
  "Rule",
  "Match",
];

function mealExportRows(rows: readonly MealRow[]) {
  return rows.map((row) => [
    row.associate,
    row.adpName,
    row.transporterId,
    row.date,
    row.dateLabel,
    row.amazonStatus,
    row.amazonTimes,
    row.adpMeal,
    row.adpTimes,
    row.hoursLabel,
    row.mismatch ? "Yes" : "No",
    row.rule,
  ]);
}

const MEAL_HEADERS = [
  "Associate",
  "ADP name",
  "Transporter ID",
  "Date",
  "Date label",
  "Amazon status",
  "Amazon breaks",
  "ADP meal",
  "ADP times",
  "Hours",
  "Mismatch",
  "Rule",
];

function unmatchedExportRows(rows: readonly UnmatchedRow[]) {
  return rows.map((row) => [row.name, row.secondary, row.detail, row.reason]);
}

const UNMATCHED_HEADERS = ["Name", "Secondary", "Activity", "Why unmatched"];

export type ComplianceExportView = "missing" | "over12" | "over60" | "meals" | "unmatched";

function stampedCsv(station: string, headers: readonly string[], rows: readonly (readonly string[])[]) {
  const stamped = withStationColumn(station, headers, rows);
  return toCsv(stamped.headers, stamped.rows);
}

export function complianceViewCsv(report: ComplianceReport, view: ComplianceExportView): CsvFile {
  const stamp = `week-${report.week}`;
  const station = report.station;
  if (view === "missing") {
    return {
      filename: datasetFilename("compliance-missing-punches", stamp, station),
      csv: stampedCsv(station, EXCEPTION_HEADERS, exceptionExportRows(report.missingPunches)),
    };
  }
  if (view === "over12") {
    return {
      filename: datasetFilename("compliance-over-12", stamp, station),
      csv: stampedCsv(station, EXCEPTION_HEADERS, exceptionExportRows(report.over12)),
    };
  }
  if (view === "over60") {
    const peak = report.over60Peak;
    return {
      filename: datasetFilename("compliance-over-60", stamp, station),
      csv: toSectionedCsv(
        withStationSections(station, [
          {
            title: "Rolling windows",
            headers: ["Window", "Coverage"],
            rows: report.over60Windows.map((window) => [window.label, window.coverageLabel]),
          },
          {
            title: "Highest captured total",
            headers: ["Associate", "ADP name", "Hours", "Window", "Coverage"],
            rows: peak
              ? [[peak.associate, peak.adpName, peak.hoursLabel, peak.windowLabel, peak.coverageLabel]]
              : [],
          },
          {
            title: "Associates over 60",
            headers: EXCEPTION_HEADERS,
            rows: exceptionExportRows(report.over60),
          },
        ]),
      ),
    };
  }
  if (view === "meals") {
    return {
      filename: datasetFilename("compliance-meals", stamp, station),
      csv: stampedCsv(station, MEAL_HEADERS, mealExportRows(report.mealRows)),
    };
  }
  return {
    filename: datasetFilename("compliance-unmatched", stamp, station),
    csv: toSectionedCsv(
      withStationSections(station, [
        {
          title: "Unmatched Amazon roster",
          headers: UNMATCHED_HEADERS,
          rows: unmatchedExportRows(report.unmatchedAmazon),
        },
        {
          title: "Unmatched ADP timecard",
          headers: UNMATCHED_HEADERS,
          rows: unmatchedExportRows(report.unmatchedAdp),
        },
      ]),
    ),
  };
}

export function complianceCombinedCsv(report: ComplianceReport): CsvFile {
  const peak = report.over60Peak;
  return {
    filename: datasetFilename("compliance", `week-${report.week}`, report.station),
    csv: toSectionedCsv(withStationSections(report.station, [
      {
        title: "Missing punches",
        headers: EXCEPTION_HEADERS,
        rows: exceptionExportRows(report.missingPunches),
      },
      {
        title: "Over 12 hours",
        headers: EXCEPTION_HEADERS,
        rows: exceptionExportRows(report.over12),
      },
      {
        title: "Over 60 hours",
        headers: EXCEPTION_HEADERS,
        rows: exceptionExportRows(report.over60),
      },
      {
        title: "Highest captured total",
        headers: ["Associate", "ADP name", "Hours", "Window", "Coverage"],
        rows: peak
          ? [[peak.associate, peak.adpName, peak.hoursLabel, peak.windowLabel, peak.coverageLabel]]
          : [],
      },
      {
        title: "Meal rows",
        headers: MEAL_HEADERS,
        rows: mealExportRows(report.mealRows),
      },
    ])),
  };
}
