import Link from "next/link";
import { notFound } from "next/navigation";
import { DeliveryPeriodNote } from "@/components/period-coverage";
import { PageHeader } from "@/components/page-header";
import { RouteDetail } from "@/components/route-detail";
import { Button } from "@/components/ui/button";
import { getDriver, getRoute } from "@/lib/data";

export async function generateStaticParams() {
  const { getRoutes } = await import("@/lib/data");
  return getRoutes().map((route) => ({ id: route.id }));
}

export default async function RoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const route = getRoute(id);
  if (!route) notFound();

  const names = route.associateIds
    .map((associateId) => getDriver(associateId)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <PageHeader
        title={`Route ${route.code}`}
        description={`${route.stationCode} Memphis · ${names || "Unassigned"} · DSP Console Delivery Execution · Sep 23, 2026`}
        actions={
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/routes" />}>
            Back to board
          </Button>
        }
      />
      <DeliveryPeriodNote />
      <div className="rounded-xl border bg-card p-5">
        <RouteDetail route={route} />
      </div>
    </div>
  );
}
