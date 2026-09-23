"use client";

import Link from "next/link";
import { useDateRange } from "@/components/layout/date-range-context";
import { buttonVariants } from "@/components/ui/button";
import { SCORECARD_WEEKS, type ScorecardWeek } from "@/lib/data/scorecard";

export function ScorecardWeekSwitcher({ week }: { week: ScorecardWeek }) {
  const { hrefWithPeriod } = useDateRange();

  return (
    <div className="flex gap-1" role="group" aria-label="Scorecard week">
      {SCORECARD_WEEKS.map((item) => {
        const href = item === 38 ? "/scorecard" : `/scorecard?week=${item}`;
        return (
          <Link
            key={item}
            href={hrefWithPeriod(href)}
            aria-current={week === item ? "page" : undefined}
            className={buttonVariants({
              size: "sm",
              variant: week === item ? "default" : "outline",
            })}
          >
            Week {item}
          </Link>
        );
      })}
    </div>
  );
}
