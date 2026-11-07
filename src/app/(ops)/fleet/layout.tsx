import { StationDatasetGate } from "@/components/station-dataset-gate";

export const metadata = { title: "Fleet" };

export default function FleetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StationDatasetGate dataset="fleet" title="Fleet">
      {children}
    </StationDatasetGate>
  );
}
