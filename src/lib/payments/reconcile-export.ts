import { formatNumber, formatUsd } from "../format";
import type { ReconcileRow, ServiceCompareRow, WeekReconcile } from "./types";
import { RECONCILE_STATUS_LABEL } from "./types";

const COLUMNS = [
  "Week",
  "Period",
  "Group",
  "Field",
  "Invoice",
  "Work Summary",
  "Status",
  "Variance",
  "Note",
] as const;

export function reconcileToCsv(report: WeekReconcile) {
  const lines = [COLUMNS.join(",")];
  for (const record of exportRecords(report)) {
    lines.push(COLUMNS.map((column) => csvCell(record[column])).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function reconcileToExcel(report: WeekReconcile) {
  const header = COLUMNS.map((column) => excelCell(column)).join("");
  const body = exportRecords(report)
    .map((record) => `<Row>${COLUMNS.map((column) => excelCell(record[column])).join("")}</Row>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Reconcile">
<Table>
<Row>${header}</Row>
${body}
</Table>
</Worksheet>
</Workbook>`;
}

export function reconcileExportFilename(report: WeekReconcile, extension: "csv" | "xls") {
  return `reconcile-week-${report.week}.${extension}`;
}

function exportRecords(report: WeekReconcile) {
  return [
    ...report.rows.map((item) => record(report, "Summary", item.field, item.invoice.text, item.workSummary.text, item.status, varianceText(item), item.note)),
    ...report.serviceRows.map((item) =>
      record(
        report,
        "Service",
        item.label,
        serviceInvoiceText(item, report.invoiceListed),
        serviceWorkText(item),
        item.status,
        "",
        item.note
      )
    ),
  ];
}

function record(
  report: WeekReconcile,
  group: string,
  field: string,
  invoice: string,
  workSummary: string,
  status: ReconcileRow["status"],
  variance: string,
  note: string
): Record<(typeof COLUMNS)[number], string> {
  return {
    Week: String(report.week),
    Period: report.period,
    Group: group,
    Field: field,
    Invoice: invoice,
    "Work Summary": workSummary,
    Status: RECONCILE_STATUS_LABEL[status],
    Variance: variance,
    Note: note,
  };
}

function varianceText(row: ReconcileRow) {
  if (row.variance == null || row.varianceUnit == null) return "";
  const formatted =
    row.varianceUnit === "USD" ? formatUsd(row.variance) : formatNumber(row.variance);
  if (row.variance > 0) return `+${formatted} ${row.varianceUnit}`;
  return `${formatted} ${row.varianceUnit}`;
}

function serviceInvoiceText(row: ServiceCompareRow, invoiceListed: boolean) {
  if (!invoiceListed) return "Not yet listed";
  if (row.invoiceRoutePayments == null || row.invoiceAmountCents == null) return "Not on invoice";
  const payments = `${formatNumber(row.invoiceRoutePayments)} route ${row.invoiceRoutePayments === 1 ? "payment" : "payments"}`;
  return `${payments} · ${formatUsd(row.invoiceAmountCents / 100)}`;
}

function serviceWorkText(row: ServiceCompareRow) {
  if (row.completedRoutes == null) return "Not in Work Summary route rows";
  return `${formatNumber(row.completedRoutes)} ${row.completedRoutes === 1 ? "route completed" : "routes completed"}`;
}

function csvCell(value: string) {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function excelCell(value: string) {
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
