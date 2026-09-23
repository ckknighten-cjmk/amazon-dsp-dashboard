import { getReconcile, parseReconcileWeek } from "@/lib/data";
import { reconcileExportFilename, reconcileToCsv, reconcileToExcel } from "@/lib/payments/reconcile-export";

export function GET(request: Request) {
  const url = new URL(request.url);
  const week = parseReconcileWeek(url.searchParams.get("week"));
  const format = url.searchParams.get("format");
  const report = getReconcile(week);

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
