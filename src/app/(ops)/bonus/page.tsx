import { BonusBoard } from "@/components/bonus-board";
import { StationEmptyPage } from "@/components/station-empty";
import { getBonusList } from "@/lib/data/bonus";
import { loadStationDataset } from "@/lib/data/station-seeds";
import { currentStation } from "@/lib/station-request";

export const metadata = {
  title: "10 Hour Bonus",
};

export default async function BonusPage({
  searchParams,
}: {
  searchParams: Promise<{ station?: string | string[] }>;
}) {
  const station = await currentStation((await searchParams).station);
  const list = loadStationDataset(station, "bonus", () => getBonusList());
  if (!list) return <StationEmptyPage title="10 Hour Bonus" station={station} />;
  return <BonusBoard list={list} />;
}
