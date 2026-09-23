"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportExcelButton({
  filename,
  xml,
  label = "Export Excel",
}: {
  filename: string;
  xml: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={`${label}, ${filename}`}
      onClick={() => downloadExcel(filename, xml)}
    >
      <Download />
      {label}
    </Button>
  );
}

function downloadExcel(filename: string, xml: string) {
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
