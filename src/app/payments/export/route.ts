import { getReconcile, parseReconcileWeek } from "@/lib/data";
import { loadStationDataset } from "@/lib/data/station-seeds";
import { reconcileExportFilename, reconcileToCsv, reconcileToExcel } from "@/lib/payments/reconcile-export";
import { currentStation } from "@/lib/station-request";
import { stationEmptyTitle } from "@/lib/stations";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const week = parseReconcileWeek(url.searchParams.get("week"));
  const format = url.searchParams.get("format");
  const station = await currentStation(url.searchParams.get("station"));
  const report = loadStationDataset(station, "payments", () => getReconcile(week), { week });
  if (!report) {
    return new Response(stationEmptyTitle(station), { status: 404 });
  }

  if (format === "csv") {
    return new Response(reconcileToCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${reconcileExportFilename(report, "csv")}"`,
      },
    });
  }

  if (format === "xls" || format === "excel") {
    return new Response(reconcileToExcel(report), {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="${reconcileExportFilename(report, "xls")}"`,
      },
    });
  }

  return new Response("Use format=csv or format=xls.", { status: 400 });
}
