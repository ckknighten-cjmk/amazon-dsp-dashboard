"use client";

import { StationEmptyPage } from "@/components/station-empty";
import { useStation } from "@/components/layout/station-context";
import { hasStationDataset, type DatasetId } from "@/lib/data/station-seeds";

/** Hides a page that still reads DNA4 modules directly. Used by Fleet. */
export function StationDatasetGate({
  dataset,
  title,
  children,
}: {
  dataset: DatasetId;
  title: string;
  children: React.ReactNode;
}) {
  const { code } = useStation();
  if (!hasStationDataset(code, dataset)) {
    return <StationEmptyPage title={title} station={code} />;
  }
  return children;
}
