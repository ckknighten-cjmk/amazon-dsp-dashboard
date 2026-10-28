"use client";

import { AlertsStrip } from "@/components/alerts-strip";
import { RouteStatusChart, VolumeChart } from "@/components/charts";
import { KpiCard } from "@/components/kpi-card";
import { useDateRange } from "@/components/layout/date-range-context";
import { useStation } from "@/components/layout/station-context";
import { PageHeader, EmptyState } from "@/components/page-header";
import { StationEmptyPage } from "@/components/station-empty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryDayPicker } from "@/components/delivery-day-picker";
import { getDeliveryBoard, getOverview, getStation } from "@/lib/data";
import { deliveryDayLabel, deliveryDaysInRange, detailDeliveryDay } from "@/lib/data/delivery-catalog";
import { loadStationDataset } from "@/lib/data/station-seeds";
import { seedCapturedLabel } from "@/lib/format";
import { DELIVERY_COVERAGE, STATION_TODAY } from "@/lib/period";

export default function OverviewPage() {
  const { code } = useStation();
  const { range } = useDateRange();
  const snapshot = loadStationDataset(code, "overview", () => getOverview(range));
  const station = loadStationDataset(code, "overview", () => getStation());
  const board = loadStationDataset(code, "overview", () => getDeliveryBoard());
  if (!snapshot || !station || !board) {
    return <StationEmptyPage title="Station overview" station={code} />;
  }
  const days = deliveryDaysInRange(range);
  const detail = detailDeliveryDay(range);
  const shown = detail?.board ?? board;
  const liveFocus = !detail || detail.serviceDate === STATION_TODAY;
  const captured = seedCapturedLabel(shown.capturedAt);

  return (
    <div>
      <PageHeader
        title="Station overview"
        description={`${station.companyName} · ${station.stationCode} ${station.stationName}. ${snapshot.asOfLabel}.`}
        updatedLabel={captured}
        seedAsOf={shown.capturedAt}
        date={shown.serviceDate}
      />

      {snapshot.kpis.length === 0 ? (
        <EmptyState
          title="No delivery metrics in this period"
          description={`${snapshot.asOfLabel} Other days are left blank rather than filled with zeros.`}
        />
      ) : (
        <>
          <section aria-labelledby="alerts-heading" className="mb-5">
            <h2 id="alerts-heading" className="mb-2 text-sm font-medium">
              Alerts
            </h2>
            <AlertsStrip alerts={snapshot.alerts} />
          </section>

          <section aria-labelledby="kpi-heading" className="mb-5">
            <h2 id="kpi-heading" className="sr-only">
              Key metrics
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
              {snapshot.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>

          <DeliveryDayPicker days={days} selected={detail?.serviceDate ?? STATION_TODAY} />

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>
                  {days.length <= 1 && liveFocus
                    ? "Volume · Oct 27"
                    : days.length <= 1
                      ? `Volume · ${deliveryDayLabel(detail?.serviceDate ?? STATION_TODAY)}`
                      : "Volume · seeded days"}
                </CardTitle>
                <CardDescription>
                  {days.length <= 1 && liveFocus
                    ? `Console Delivery Execution planned vs delivered. ${DELIVERY_COVERAGE.label}. Other days were not in this pull.`
                    : "Console Delivery Execution planned vs delivered for each seeded day in this period. Days without a file are left blank."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VolumeChart data={snapshot.packagesByDay} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {liveFocus ? "Oct 27 routes" : `Routes · ${deliveryDayLabel(detail?.serviceDate ?? STATION_TODAY)}`}
                </CardTitle>
                <CardDescription>
                  {liveFocus
                    ? `Status mix from the ${station.stationCode} Console board (40 routes). ${DELIVERY_COVERAGE.label}.`
                    : `Status mix from the ${station.stationCode} Console board (${detail?.board.totals.routes ?? 0} routes) on ${detail?.serviceDate}.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RouteStatusChart data={snapshot.routeStatusCounts} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
