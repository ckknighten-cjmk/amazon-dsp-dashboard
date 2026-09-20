import {
  DAMAGE_REPORT_COLUMNS,
  DAMAGE_TYPE_LABEL,
  INVESTIGATION_LABEL,
  type DamageReportRow,
} from "../lib/damage";
import { cn } from "../lib/cn";
import { formatDate } from "../lib/format";
import type { InvestigationStatus } from "../types/database";

const investigationClass: Record<InvestigationStatus, string> = {
  open: "badge-danger",
  pending_driver: "badge-warning",
  charged: "badge-danger",
  cleared: "badge-success",
  closed: "badge-neutral",
};

export default function DamageReportTable({
  rows,
  empty = "No damage events in this view.",
}: {
  rows: DamageReportRow[];
  empty?: string;
}) {
  return (
    <table className="w-full min-w-[960px] text-left text-sm">
      <thead className="text-xs uppercase tracking-wide text-slate-500">
        <tr>
          {DAMAGE_REPORT_COLUMNS.map((column) => (
            <th key={column} className={column === "Vehicle" ? "px-5 py-2 font-medium" : "px-3 py-2 font-medium"}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
            <td className="px-5 py-3">
              <p className="font-medium text-slate-900 dark:text-white">{row.vanId}</p>
              <p className="text-xs text-slate-500">{row.stationCode}</p>
            </td>
            <td className="px-3 py-3">
              <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(row.detectedDate)}</p>
              <p className="text-xs text-slate-500">{row.detectedDate}</p>
            </td>
            <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-200">{row.priorDriverName}</td>
            <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-200">{row.currentDriverName}</td>
            <td className="px-3 py-3 tabular-nums">{row.routeCode}</td>
            <td className="px-3 py-3 capitalize">{DAMAGE_TYPE_LABEL[row.damage_type]}</td>
            <td className="px-3 py-3">
              <span className={cn("badge", investigationClass[row.investigation_status])}>
                {INVESTIGATION_LABEL[row.investigation_status]}
              </span>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td className="px-5 py-6 text-sm text-slate-500" colSpan={DAMAGE_REPORT_COLUMNS.length}>
              {empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
