import { ComplianceBoard } from "@/components/compliance-board";
import { StationEmptyPage } from "@/components/station-empty";
import { getCompliance, parseComplianceWeek } from "@/lib/data";
import { loadStationDataset } from "@/lib/data/station-seeds";
import { currentStation } from "@/lib/station-request";

export const metadata = {
  title: "Compliance",
};

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string | string[]; station?: string | string[] }>;
}) {
  const params = await searchParams;
  const station = await currentStation(params.station);
  const week = parseComplianceWeek(params.week);
  const report = loadStationDataset(station, "compliance", () => getCompliance(week), { week });
  if (!report) return <StationEmptyPage title="Compliance" station={station} week={week} />;
  return <ComplianceBoard key={`${station}-${week}`} report={report} />;
}
