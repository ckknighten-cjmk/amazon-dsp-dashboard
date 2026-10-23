/**
 * Every dated DNA4 Delivery Execution seed, oldest first.
 * The live board is the Oct 22 capture from `delivery-execution.ts`.
 * A newer evening wrap replaces that import and moves the previous live
 * file into this list. Backfilling an older day only adds an import here.
 * Today moves only when the live capture moves.
 */
import { format, parseISO } from "date-fns";
import type { DateRange } from "@/lib/types";
import { datasetFilename, toCsv, withStationColumn } from "@/lib/export/csv";
import { formatCompletionPct, formatConsoleCapture, routeStatusLabel } from "@/lib/format";
import { dateInRange, STATION_TODAY } from "@/lib/period";
import {
  liveDeliveryDay,
  mapDeliverySeed,
  type DeliveryDay,
  type DeliverySeed,
} from "@/lib/data/delivery-execution";
import sep21 from "@/lib/data/seed/delivery-execution-2026-09-21.json";
import sep23 from "@/lib/data/seed/delivery-execution-2026-09-23.json";
import sep24 from "@/lib/data/seed/delivery-execution-2026-09-24.json";
import sep25 from "@/lib/data/seed/delivery-execution-2026-09-25.json";
import sep28 from "@/lib/data/seed/delivery-execution-2026-09-28.json";
import sep29 from "@/lib/data/seed/delivery-execution-2026-09-29.json";
import sep30 from "@/lib/data/seed/delivery-execution-2026-09-30.json";
import oct01 from "@/lib/data/seed/delivery-execution-2026-10-01.json";
import oct02 from "@/lib/data/seed/delivery-execution-2026-10-02.json";
import oct05 from "@/lib/data/seed/delivery-execution-2026-10-05.json";
import oct06 from "@/lib/data/seed/delivery-execution-2026-10-06.json";
import oct07 from "@/lib/data/seed/delivery-execution-2026-10-07.json";
import oct08 from "@/lib/data/seed/delivery-execution-2026-10-08.json";
import oct09 from "@/lib/data/seed/delivery-execution-2026-10-09.json";
import oct12 from "@/lib/data/seed/delivery-execution-2026-10-12.json";
import oct13 from "@/lib/data/seed/delivery-execution-2026-10-13.json";
import oct14 from "@/lib/data/seed/delivery-execution-2026-10-14.json";
import oct15 from "@/lib/data/seed/delivery-execution-2026-10-15.json";
import oct16 from "@/lib/data/seed/delivery-execution-2026-10-16.json";
import oct19 from "@/lib/data/seed/delivery-execution-2026-10-19.json";
import oct20 from "@/lib/data/seed/delivery-execution-2026-10-20.json";
import oct21 from "@/lib/data/seed/delivery-execution-2026-10-21.json";

const HISTORY = [
  sep21,
  sep23,
  sep24,
  sep25,
  sep28,
  sep29,
  sep30,
  oct01,
  oct02,
  oct05,
  oct06,
  oct07,
  oct08,
  oct09,
  oct12,
  oct13,
  oct14,
  oct15,
  oct16,
  oct19,
  oct20,
  oct21,
].map((file) => mapDeliverySeed(file as DeliverySeed));

/** Live Oct 22 object, plus every earlier file. Sorted by service date. */
export const DELIVERY_DAYS: readonly DeliveryDay[] = [...HISTORY, liveDeliveryDay].sort((a, b) =>
  a.serviceDate.localeCompare(b.serviceDate)
);

export const DELIVERY_SEED_DATES: readonly string[] = DELIVERY_DAYS.map((day) => day.serviceDate);

export function deliveryDaysInRange(range: DateRange): DeliveryDay[] {
  return DELIVERY_DAYS.filter((day) => dateInRange(day.serviceDate, range));
}

/**
 * Board to show for a period.
 * A range that includes the station clock uses the live Oct 22 capture.
 * Any other range uses the latest seeded day inside it.
 */
export function detailDeliveryDay(range: DateRange): DeliveryDay | null {
  const days = deliveryDaysInRange(range);
  if (days.length === 0) return null;
  return days.find((day) => day.serviceDate === STATION_TODAY) ?? days[days.length - 1]!;
}

export function deliveryDayLabel(serviceDate: string) {
  return format(parseISO(serviceDate), "MMM d");
}

export function describeDeliveryDay(day: DeliveryDay) {
  const gauges = day.board.totals.executionGaugesPct;
  const gaugeText =
    gauges.locations == null &&
    gauges.stops == null &&
    gauges.packages == null &&
    gauges.attemptSuccess == null
      ? "Execution gauges were not published on this capture."
      : `Execution gauges: locations ${gaugePct(gauges.locations)}, stops ${gaugePct(gauges.stops)}, packages ${gaugePct(gauges.packages)}, attempt success ${gaugePct(gauges.attemptSuccess)}.`;
  const open = day.routes.filter((route) => route.status === "in_progress").map((route) => route.code);
  const complete = day.routes.filter((route) => route.status === "completed").length;
  const openText = open.length > 0 ? ` (${open.join(", ")})` : "";
  return `Amazon DSP Console ${day.board.snapshot.replaceAll("-", " ")} for DNA4 Memphis / CJMK Inc., service day ${day.serviceDate}, captured at ${formatConsoleCapture(day.board.capturedAt)}. Vehicle and on-time % were not on the Console — shown as unavailable. ${gaugeText} ${day.board.totals.routes} routes: ${day.board.totals.inProgress} in progress${openText}; ${complete} complete.`;
}

function gaugePct(value: number | null) {
  return value == null ? "not published" : `${value}%`;
}

function nameOf(day: DeliveryDay, id: string) {
  return day.drivers.find((driver) => driver.id === id)?.name;
}

export function deliveryDayRoutesCsv(day: DeliveryDay) {
  const headers = [
    "Route",
    "Primary associate",
    "Associates",
    "Rescue",
    "Rescuers",
    "Rescue basis",
    "Stops done",
    "Stops planned",
    "Packages delivered",
    "Packages planned",
    "Remaining",
    "Status",
    "Completion",
    "Notes",
  ];
  const rows = day.routes.map((route) => {
    const names = route.associateIds.map((id) => nameOf(day, id) ?? id);
    const rescuers = route.rescueDriverIds.map((id) => nameOf(day, id) ?? id);
    return [
      route.code,
      names[0] ?? "",
      names.join("; "),
      route.receivedRescue ? "Yes" : "No",
      route.receivedRescue ? rescuers.join("; ") : "",
      route.receivedRescue ? "Multi-associate route; not an Amazon rescueActions flag" : "",
      route.completedStops,
      route.stopCount,
      route.packagesDelivered,
      route.packageCount,
      route.packagesRemaining,
      routeStatusLabel[route.status],
      formatCompletionPct(route.progressPct),
      route.notes ?? "",
    ];
  });
  const stamped = withStationColumn("DNA4", headers, rows);
  return {
    filename: datasetFilename("routes", day.serviceDate, "DNA4"),
    csv: toCsv(stamped.headers, stamped.rows),
  };
}

export function deliveryDayExceptionsCsv(day: DeliveryDay) {
  const headers = [
    "Scannable ID",
    "Route",
    "Transporter",
    "Transporter ID",
    "Address",
    "Status",
    "Reason",
    "Last scan",
  ];
  const rows = day.exceptions.map((row) => [
    row.scannableId,
    row.routeCode,
    row.transporterName,
    row.transporterId,
    row.address,
    row.status,
    row.reasonCode,
    row.lastScan ?? "",
  ]);
  const stamped = withStationColumn("DNA4", headers, rows);
  return {
    filename: datasetFilename("package-exceptions", day.serviceDate, "DNA4"),
    csv: toCsv(stamped.headers, stamped.rows),
  };
}
