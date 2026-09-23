export type CsvValue = string | number | null | undefined;

export function csvCell(value: CsvValue) {
  if (value == null) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function toCsv(headers: readonly string[], rows: readonly (readonly CsvValue[])[]) {
  const lines = [headers, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(","));
  return `${lines.join("\r\n")}\r\n`;
}

export function toSectionedCsv(
  sections: readonly {
    title: string;
    headers: readonly string[];
    rows: readonly (readonly CsvValue[])[];
  }[]
) {
  const blocks = sections.map((section) => {
    const body = toCsv(section.headers, section.rows).trimEnd();
    return `${csvCell(section.title)}\r\n${body}`;
  });
  return `${blocks.join("\r\n\r\n")}\r\n`;
}

export function datasetFilename(dataset: string, stamp: string) {
  const slug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${slug(dataset)}-${slug(stamp)}.csv`;
}

/** Drop a leading Excel BOM so tests can read the header row. */
export function csvLines(csv: string) {
  return csv.replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
}
