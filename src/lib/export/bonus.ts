import { bonusCoDriverLabel, type BonusList } from "@/lib/data/bonus";
import { toCsv, type CsvValue } from "@/lib/export/csv";
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

export function bonusCsv(list: BonusList) {
  return {
    filename: "10-hour-bonus-week-38-by-da.csv",
    csv: toCsv(HEADERS, bonusRows(list)),
  };
}

export function bonusExcel(list: BonusList) {
  return {
    filename: "10-hour-bonus-week-38-by-da.xls",
    xml: toExcelXml("10 Hour Bonus", HEADERS, bonusRows(list)),
  };
}
