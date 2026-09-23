import { BonusBoard } from "@/components/bonus-board";
import { getBonusList } from "@/lib/data/bonus";

export const metadata = {
  title: "10 Hour Bonus",
};

export default function BonusPage() {
  return <BonusBoard list={getBonusList()} />;
}
