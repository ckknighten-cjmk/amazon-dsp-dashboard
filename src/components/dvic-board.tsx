import { EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDvicReport } from "@/lib/data/dvic";

const PHASE_LABEL = {
  post_trip: "Post-trip",
  avi_post_trip: "AVI post-trip",
} as const;

export function DvicBoard() {
  const report = getDvicReport();
  const totals = report.totals;

  return (
    <section aria-labelledby="dvic-heading" className="mb-6" data-new-damage={report.newDamage.length}>
      <div className="mb-3">
        <h2 id="dvic-heading" className="text-sm font-semibold">
          DVIC · new damage
        </h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          {report.company} · {report.stationCode} · {report.serviceDate}. {report.source}. Open in
          Console via {report.nav}. A post-trip item is an alert only when that vehicle’s pre-trip
          for the same day did not list it.
        </p>
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <Count label="Pre-trip" value={totals.preTrip} />
        <Count label="Post-trip" value={totals.postTrip} />
        <Count label="AVI post-trip" value={totals.aviPostTrip} />
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{report.disclaimer}</p>

      {report.newDamage.length === 0 ? (
        <EmptyState
          title="No new damage to show"
          description="This capture has no inspection rows, so pre-trip and post-trip damage were not compared. Nothing was filled in."
          className="py-8"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Found on</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Why it is new</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.newDamage.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-mono text-xs">{alert.vehicleUnit}</TableCell>
                  <TableCell>{alert.serviceDate}</TableCell>
                  <TableCell>{PHASE_LABEL[alert.phase]}</TableCell>
                  <TableCell>{alert.area}</TableCell>
                  <TableCell>{alert.detail}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{alert.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
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
