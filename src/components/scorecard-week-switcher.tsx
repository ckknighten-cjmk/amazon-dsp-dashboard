"use client";

import { useRouter } from "next/navigation";
import { useDateRange } from "@/components/layout/date-range-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ScorecardWeekSwitcher({
  week,
  options,
}: {
  week: number;
  options: ReadonlyArray<{ week: number; label: string }>;
}) {
  const router = useRouter();
  const { hrefWithPeriod } = useDateRange();
  const items = options.map((option) => ({ value: String(option.week), label: option.label }));

  return (
    <Select
      value={String(week)}
      items={items}
      onValueChange={(value) => {
        if (!value || value === String(week)) return;
        router.push(hrefWithPeriod(`/scorecard?week=${value}`));
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label="Scorecard week"
        className="w-[min(100%,24rem)]"
        data-scorecard-week-select
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="max-h-80 w-[min(100vw-2rem,24rem)]">
        {options.map((option) => (
          <SelectItem key={option.week} value={String(option.week)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
