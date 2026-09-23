import { ComplianceBoard } from "@/components/compliance-board";
import { getCompliance, parseComplianceWeek } from "@/lib/data";

export const metadata = {
  title: "Compliance",
};

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string | string[] }>;
}) {
  const week = parseComplianceWeek((await searchParams).week);
  return <ComplianceBoard key={week} report={getCompliance(week)} />;
}
