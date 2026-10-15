import type { ReactNode } from "react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { NO_CAPTURE_LABEL, stationEmptyTitle, stationProfile, type StationCode } from "@/lib/stations";

export function StationEmptyPage({
  title,
  station,
  actions,
  week,
  date,
}: {
  title: string;
  station: StationCode;
  actions?: ReactNode;
  week?: string | number | null;
  date?: string | null;
}) {
  const profile = stationProfile(station);
  return (
    <div data-station-empty={profile.code}>
      <PageHeader
        title={title}
        description={`${profile.displayName} · ${profile.region}. No Console or ADP capture is loaded for this station.`}
        actions={actions}
        updatedLabel={NO_CAPTURE_LABEL}
        week={week}
        date={date}
      />
      <EmptyState
        title={stationEmptyTitle(profile.code)}
        description={`${profile.displayName} has no seed files yet. Figures from another station are not shown.`}
      />
    </div>
  );
}
