import { FleetPageClient } from "@/components/fleet-page";
import { StationEmptyPage } from "@/components/station-empty";
import { loadFleetIssueCatalog } from "@/lib/data/fleet-issues";
import { loadStationDataset } from "@/lib/data/station-seeds";
import { currentStation } from "@/lib/station-request";

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<{ station?: string | string[] }>;
}) {
  const params = await searchParams;
  const station = await currentStation(params.station);
  const catalog = loadStationDataset(station, "fleet", () => loadFleetIssueCatalog());
  if (!catalog) {
    return <StationEmptyPage title="Fleet" station={station} />;
  }
  return <FleetPageClient catalog={catalog} station={station} />;
}
