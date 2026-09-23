import type { CsvValue } from "@/lib/export/csv";

export function toExcelXml(
  sheetName: string,
  headers: readonly string[],
  rows: readonly (readonly CsvValue[])[]
) {
  const header = headers.map((cell) => excelCell(cell)).join("");
  const body = rows
    .map((row) => `<Row>${row.map((cell) => excelCell(cell)).join("")}</Row>`)
    .join("");
  const name = xmlEscape(sheetName).slice(0, 31);
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${name}">
<Table>
<Row>${header}</Row>
${body}
</Table>
</Worksheet>
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
