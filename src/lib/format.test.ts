import { describe, expect, it } from "vitest";
import { addDays, formatPct, formatUsdCompact, round2 } from "./format";

describe("format", () => {
  it("compacts currency at thousands and millions", () => {
    expect(formatUsdCompact(2380000)).toBe("$2.38M");
    expect(formatUsdCompact(12500)).toBe("$12.5K");
  });

  it("formats percents and date math", () => {
    expect(formatPct(99.42)).toBe("99.4%");
    expect(addDays("2026-09-20", -1)).toBe("2026-09-19");
    expect(round2(1.234)).toBe(1.23);
  });
});
