import { bonusDriverLabel, type BonusList } from "@/lib/data/bonus";
import { toCsv, type CsvValue } from "@/lib/export/csv";
import { toExcelXml } from "@/lib/export/excel";

const HEADERS = [
  "Week",
  "Period",
  "Date",
  "Route",
  "Drivers",
  "Stops completed",
  "Threshold",
] as const;

export function bonusRows(list: BonusList): CsvValue[][] {
  return list.routes.map((route) => [
    list.week,
    list.period,
    route.date,
    route.route,
    bonusDriverLabel(route.drivers),
    route.stopsCompleted,
    list.thresholdStopsCompleted,
  ]);
}

export function bonusCsv(list: BonusList) {
  return {
    filename: "10-hour-bonus-week-38.csv",
    csv: toCsv(HEADERS, bonusRows(list)),
  };
}

export function bonusExcel(list: BonusList) {
  return {
    filename: "10-hour-bonus-week-38.xls",
    xml: toExcelXml("10 Hour Bonus", HEADERS, bonusRows(list)),
  };
}
