import { FleetPageClient } from "@/components/fleet-page";
import { loadFleetIssueCatalog } from "@/lib/data/fleet-issues";

export default function FleetPage() {
  return <FleetPageClient catalog={loadFleetIssueCatalog()} />;
}
