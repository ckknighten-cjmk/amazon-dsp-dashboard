import Link from "next/link";
import { notFound } from "next/navigation";
import { DeliveryPeriodNote } from "@/components/period-coverage";
import { PageHeader } from "@/components/page-header";
import { RouteDetail } from "@/components/route-detail";
import { StationEmptyPage } from "@/components/station-empty";
import { Button } from "@/components/ui/button";
import { getDeliveryBoard, getDriver, getRoute } from "@/lib/data";
import { loadStationDataset } from "@/lib/data/station-seeds";
import { seedCapturedLabel } from "@/lib/format";
import { currentStation } from "@/lib/station-request";
import { hrefWithStation } from "@/lib/stations";

export async function generateStaticParams() {
  const { getRoutes } = await import("@/lib/data");
  return getRoutes().map((route) => ({ id: route.id }));
}

export default async function RoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ station?: string | string[] }>;
}) {
  const { id } = await params;
  const station = await currentStation((await searchParams).station);
  const route = loadStationDataset(station, "routes", () => getRoute(id));
  if (route === null) return <StationEmptyPage title="Route" station={station} />;
  if (!route) notFound();

  const names = route.associateIds
    .map((associateId) => getDriver(associateId)?.name)
    .filter(Boolean)
    .join(", ");
  const board = getDeliveryBoard();
  if (!board) notFound();

  return (
    <div>
      <PageHeader
        title={`Route ${route.code}`}
        description={`${route.stationCode} Memphis · ${names || "Unassigned"} · DSP Console Delivery Execution · Oct 28, 2026`}
        actions={
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={hrefWithStation("/routes", station)} />}>
            Back to board
          </Button>
        }
        updatedLabel={seedCapturedLabel(board.capturedAt)}
        seedAsOf={board.capturedAt}
        date={board.serviceDate}
      />
      <DeliveryPeriodNote />
      <div className="rounded-xl border bg-card p-5">
        <RouteDetail route={route} />
      </div>
    </div>
  );
}
