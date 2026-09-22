import { ComplianceBoard } from "@/components/compliance-board";
import { getCompliance } from "@/lib/data";

export const metadata = {
  title: "Compliance",
};

export default function CompliancePage() {
  return <ComplianceBoard report={getCompliance()} />;
}
