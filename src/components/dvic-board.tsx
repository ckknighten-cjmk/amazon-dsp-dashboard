"use client";

import { ExportCsvButton } from "@/components/export-csv-button";
import { EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getDvicReport } from "@/lib/data/dvic";
import { dvicCsv } from "@/lib/export/datasets";
import { damageKey } from "@/lib/dvic/compare";
import type { DvicDamage, DvicDayPair } from "@/lib/dvic/types";

export function DvicBoard() {
  const report = getDvicReport();
  const totals = report.totals;
  const file = dvicCsv();

  return (
    <section
      aria-labelledby="dvic-heading"
      className="mb-6"
      data-new-damage={report.newDamage.length}
      data-dvic-pairs={report.pairs.length}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="dvic-heading" className="text-sm font-semibold">
            DVIC · pre-trip vs post-trip
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {report.company} · {report.stationCode} · {report.serviceDate}. {report.source}. Open in
            Console via {report.nav}. Each card is one vehicle on one service day. A post-trip item
            is marked new only when that vehicle’s pre-trip for the same day did not list it.
          </p>
        </div>
        <ExportCsvButton filename={file.filename} csv={file.csv} label="Export DVIC" />
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <Count label="Pre-trip" value={totals.preTrip} />
        <Count label="Post-trip" value={totals.postTrip} />
        <Count label="AVI post-trip" value={totals.aviPostTrip} />
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{report.disclaimer}</p>

      {report.pairs.length === 0 ? (
        <EmptyState
          title="No inspections to pair"
          description="This capture has no checklist rows, so there is no pre-trip or post-trip damage to compare. Drop Console rows into src/lib/data/seed/dvic-2026-09-23.json (vehicleUnit, serviceDate, phase, and damage area plus detail). Nothing was filled in."
          className="py-8"
        />
      ) : (
        <div className="space-y-3">
          {report.pairs.map((pair) => (
            <PairCard key={pair.id} pair={pair} />
          ))}
        </div>
      )}
    </section>
  );
}

function PairCard({ pair }: { pair: DvicDayPair }) {
  const newKeys = new Set(pair.newDamage.map((alert) => damageKey(alert)));
  const alert = pair.newDamage.length > 0;

  return (
    <article
      className="rounded-xl border bg-card p-4"
      data-vehicle={pair.vehicleUnit}
      data-service-date={pair.serviceDate}
      data-alert={alert ? "yes" : "no"}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="font-mono text-sm font-medium">{pair.vehicleUnit}</p>
        <p className="text-xs text-muted-foreground">{pair.serviceDate}</p>
        {alert ? (
          <Badge variant="destructive">
            {pair.newDamage.length} new
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">No new damage</span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DamageList title="Pre-trip" present={pair.hadPreTrip} items={pair.preTrip} newKeys={new Set()} />
        <DamageList
          title="Post-trip"
          present={pair.hadPostTrip}
          items={pair.postTrip}
          newKeys={newKeys}
        />
      </div>
      {pair.hadAviPostTrip ? (
        <div className="mt-3">
          <DamageList
            title="AVI post-trip"
            present
            items={pair.aviPostTrip}
            newKeys={newKeys}
          />
        </div>
      ) : null}
    </article>
  );
}

function DamageList({
  title,
  present,
  items,
  newKeys,
}: {
  title: string;
  present: boolean;
  items: DvicDamage[];
  newKeys: Set<string>;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {!present ? (
        <p className="mt-2 text-sm text-muted-foreground">Not in this capture.</p>
      ) : items.length === 0 ? (
        <p className="mt-2 text-sm">No damage listed.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => {
            const isNew = newKeys.has(damageKey(item));
            return (
              <li key={`${damageKey(item)}-${index}`} className="flex flex-wrap items-baseline gap-2 text-sm">
                <span>
                  {item.area.trim()}: {item.detail.trim()}
                </span>
                {isNew ? <Badge variant="destructive">New</Badge> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
