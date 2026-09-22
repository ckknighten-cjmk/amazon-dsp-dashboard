"use client";

import { AlertsStrip } from "@/components/alerts-strip";
import { RouteStatusChart, VolumeChart } from "@/components/charts";
import { KpiCard } from "@/components/kpi-card";
import { useDateRange } from "@/components/layout/date-range-context";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverview, getStation } from "@/lib/data";

export default function OverviewPage() {
  const { range } = useDateRange();
  const snapshot = getOverview(range);
  const station = getStation();

  return (
    <div>
      <PageHeader
        title="Station overview"
        description={`${station.companyName} · ${station.stationCode} ${station.stationName}. ${snapshot.asOfLabel}.`}
      />

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

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Volume · Sep 21</CardTitle>
            <CardDescription>
              Console Delivery Execution planned vs delivered. Other days were not in this pull.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VolumeChart data={snapshot.packagesByDay} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today’s routes</CardTitle>
            <CardDescription>
              Status mix from the {station.stationCode} Console board (37 routes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RouteStatusChart data={snapshot.routeStatusCounts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
