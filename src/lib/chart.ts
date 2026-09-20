import { useMemo } from "react";
import { useTheme } from "./theme";

export function useChartStyles() {
  const { theme } = useTheme();
  return useMemo(() => {
    const dark = theme === "dark";
    return {
      tooltip: {
        backgroundColor: dark ? "#0f1626" : "#ffffff",
        border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
        borderRadius: 8,
        color: dark ? "#e2e8f0" : "#0f172a",
      },
      grid: dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)",
      axis: dark ? "#64748b" : "#94a3b8",
      cursor: dark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
    };
  }, [theme]);
}
