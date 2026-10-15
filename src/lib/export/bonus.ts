import { bonusCoDriverLabel, type BonusList } from "@/lib/data/bonus";
import { toCsv, withStationColumn, type CsvValue } from "@/lib/export/csv";
import { toExcelXml } from "@/lib/export/excel";

const HEADERS = [
  "date",
  "deliveryAssociate",
  "stopsCompleted",
  "route",
  "multiTransporter",
  "coDrivers",
] as const;

export function bonusRows(list: BonusList): CsvValue[][] {
  return list.entries.map((entry) => [
    entry.date,
    entry.deliveryAssociate,
    entry.stopsCompleted,
    entry.route,
    entry.multiTransporter ? "yes" : "no",
    bonusCoDriverLabel(entry.coDrivers),
  ]);
}

function bonusFilename(list: BonusList, extension: "csv" | "xls") {
  return `10-hour-bonus-${list.station.toLowerCase()}-week-${list.week}-by-da.${extension}`;
}

function bonusExport(list: BonusList) {
  return withStationColumn(list.station, HEADERS, bonusRows(list));
}

export function bonusCsv(list: BonusList) {
  const stamped = bonusExport(list);
  return {
    filename: bonusFilename(list, "csv"),
    csv: toCsv(stamped.headers, stamped.rows),
  };
}

export function bonusExcel(list: BonusList) {
  const stamped = bonusExport(list);
  return {
    filename: bonusFilename(list, "xls"),
    xml: toExcelXml("10 Hour Bonus", stamped.headers, stamped.rows),
  };
}
