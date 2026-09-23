"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportCsvButton({
  filename,
  csv,
  label = "Export CSV",
}: {
  filename: string;
  csv: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={`${label}, ${filename}`}
      onClick={() => downloadCsv(filename, csv)}
    >
      <Download />
      {label}
    </Button>
  );
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
