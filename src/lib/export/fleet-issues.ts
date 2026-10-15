import type { CsvValue } from "@/lib/export/csv";
import { datasetFilename, toSectionedCsv, withStationColumn, withStationSections } from "@/lib/export/csv";
import {
  driverCheckNote,
  defectText,
  type FleetIssueDayReport,
} from "@/lib/fleet-issues/detect";
import { OTHER_ISSUE_TYPES, type FleetIssue } from "@/lib/fleet-issues/types";
import type { StationCode } from "@/lib/stations";

const DAMAGE_HEADERS = [
  "Row",
  "Vehicle",
  "Plate",
  "VIN",
  "Defect",
  "Severity",
  "Created",
  "Repair status",
  "Repair note",
  "Operational status",
  "Source",
  "Found at",
  "Driver-check note",
  "Damage found after driver checks passed",
] as const;

const OTHER_HEADERS = ["Issue type", ...DAMAGE_HEADERS] as const;

export function newDamageCsv(report: FleetIssueDayReport, station: StationCode = "DNA4") {
  const otherRows = OTHER_ISSUE_TYPES.flatMap((issueType) =>
    report.created.other[issueType].map((issue) => [issueType, ...damageCells(issue)])
  );
  return {
    filename: datasetFilename("new-damage", report.day, station),
    csv: toSectionedCsv(
      withStationSections(station, [
        {
          title: "New inspection damage",
          headers: DAMAGE_HEADERS,
          rows: report.created.damage.map((issue) => damageCells(issue)),
        },
        {
          title: "Other issues created this day",
          headers: OTHER_HEADERS,
          rows: otherRows,
        },
      ]),
    ),
  };
}

export function newDamageExcel(report: FleetIssueDayReport, station: StationCode = "DNA4") {
  const otherRows = OTHER_ISSUE_TYPES.flatMap((issueType) =>
    report.created.other[issueType].map((issue) => [issueType, ...damageCells(issue)])
  );
  return {
    filename: datasetFilename("new-damage", report.day, station).replace(/\.csv$/, ".xls"),
    xml: workbookXml([
      stampedSheet(
        "New damage",
        DAMAGE_HEADERS,
        report.created.damage.map((issue) => damageCells(issue)),
        station,
      ),
      stampedSheet("Other issues", OTHER_HEADERS, otherRows, station),
    ]),
  };
}

function stampedSheet(
  name: string,
  headers: readonly string[],
  rows: readonly (readonly CsvValue[])[],
  station: StationCode,
) {
  const stamped = withStationColumn(station, headers, rows);
  return { name, headers: stamped.headers, rows: stamped.rows };
}

function damageCells(issue: FleetIssue): CsvValue[] {
  return [
    issue.rowId,
    issue.vehicleName,
    issue.plate,
    issue.vin,
    defectText(issue),
    issue.severity,
    issue.createdAt,
    issue.repairStatus,
    issue.repairNote ?? "",
    issue.operationalStatus,
    issue.detail ? [issue.detail.sourceInspection, issue.detail.inspector].filter(Boolean).join(" · ") : "",
    issue.detail?.foundAt ?? "",
    driverCheckNote(issue),
    issue.detail?.damageFoundAfterDriverChecksPassed ? "Yes" : "No",
  ];
}

function workbookXml(
  sheets: readonly {
    name: string;
    headers: readonly string[];
    rows: readonly (readonly CsvValue[])[];
  }[]
) {
  const body = sheets
    .map((sheet) => {
      const header = sheet.headers.map((cell) => excelCell(cell)).join("");
      const rows = sheet.rows
        .map((row) => `<Row>${row.map((cell) => excelCell(cell)).join("")}</Row>`)
        .join("");
      return `<Worksheet ss:Name="${xmlEscape(sheet.name).slice(0, 31)}"><Table><Row>${header}</Row>${rows}</Table></Worksheet>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${body}
</Workbook>`;
}

function excelCell(value: CsvValue) {
  const numeric = typeof value === "number" && Number.isFinite(value);
  const type = numeric ? "Number" : "String";
  const body = numeric ? String(value) : xmlEscape(value == null ? "" : String(value));
  return `<Cell><Data ss:Type="${type}">${body}</Data></Cell>`;
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
