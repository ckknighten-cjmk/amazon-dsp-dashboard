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

export function withStationColumn(
  station: string,
  headers: readonly string[],
  rows: readonly (readonly CsvValue[])[],
) {
  return {
    headers: ["Station", ...headers],
    rows: rows.map((row) => [station, ...row]),
  };
}

export function withStationSections(
  station: string,
  sections: readonly {
    title: string;
    headers: readonly string[];
    rows: readonly (readonly CsvValue[])[];
  }[],
) {
  return sections.map((section) => {
    const stamped = withStationColumn(station, section.headers, section.rows);
    return { title: section.title, headers: stamped.headers, rows: stamped.rows };
  });
}

export function datasetFilename(dataset: string, stamp: string, station = "DNA4") {
  const slug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${slug(dataset)}-${slug(station)}-${slug(stamp)}.csv`;
}

/** Drop a leading Excel BOM so tests can read the header row. */
export function csvLines(csv: string) {
  return csv.replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
}
