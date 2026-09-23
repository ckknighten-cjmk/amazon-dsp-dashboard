import { ExportCsvButton } from "@/components/export-csv-button";
import { PeriodCoverage } from "@/components/period-coverage";
import { PageHeader } from "@/components/page-header";
import { ScoreStatusBadge, ScoreTierBadge } from "@/components/ops-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getScorecard } from "@/lib/data";
import { scorecardCsv } from "@/lib/export/datasets";
import { formatScorecardValue, scorecardTierLabel } from "@/lib/format";
import { SCORECARD_COVERAGE } from "@/lib/period";
import { gradeMetric } from "@/lib/scorecard";
import type { ScorecardMetric } from "@/lib/types";

export const metadata = {
  title: "Scorecard",
};

function metricStatus(metric: ScorecardMetric) {
  if (metric.unit === "unavailable") return "unavailable" as const;
  if (metric.unit === "compliance") return metric.compliance ?? "unavailable";
  return gradeMetric(metric) ?? "unavailable";
}

function formatBound(metric: ScorecardMetric, value: number) {
  return formatScorecardValue({ ...metric, current: value });
}

export default function ScorecardPage() {
  const scorecard = getScorecard();
  const scorecardExport = scorecardCsv();

  return (
    <div>
      <PageHeader
        title="Amazon DSP scorecard"
        description={`${scorecard.weekLabel} · ${scorecard.periodLabel} · CJMK Inc. / DNA4 Memphis. Prior week was not shown in Console.`}
        actions={
          <>
            <ExportCsvButton
              filename={scorecardExport.filename}
              csv={scorecardExport.csv}
              label="Export scorecard"
            />
            <ScoreTierBadge tier={scorecard.overallTier} />
          </>
        }
      />

      <PeriodCoverage
        start={SCORECARD_COVERAGE.start}
        end={SCORECARD_COVERAGE.end}
        coveredNote={`${SCORECARD_COVERAGE.label}. This is the weekly Console summary. It is shown whole when the selected period overlaps that week, and it is not split into days.`}
        emptyTitle="No scorecard in this period"
        emptyDescription={`${SCORECARD_COVERAGE.label}. No other scorecard week is in this build, so the standing is not copied onto empty days.`}
      >
      <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
        {scorecard.disclaimer}
      </p>

      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-end justify-between gap-4 pt-1">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Overall standing
            </p>
            <p className="font-heading text-4xl font-semibold tabular-nums tracking-tight">
              {scorecard.overallScore.toFixed(1)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {scorecardTierLabel[scorecard.overallTier]} · {scorecard.weekLabel}
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {scorecard.categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
              >
                <span className="text-sm font-medium">{category.name}</span>
                <ScoreTierBadge tier={category.tier} size="sm" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {scorecard.categories.map((category) => {
        const metrics = scorecard.metrics.filter((m) => m.category === category.id);
        return (
          <section key={category.id} className="mb-6" aria-labelledby={`cat-${category.id}`}>
            <div className="mb-3 flex items-center gap-2">
              <h2 id={`cat-${category.id}`} className="text-sm font-semibold">
                {category.name}
              </h2>
              <ScoreTierBadge tier={category.tier} size="sm" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {metrics.map((item) => (
                <MetricCard key={item.id} metric={item} />
              ))}
            </div>
          </section>
        );
      })}
      </PeriodCoverage>
    </div>
  );
}

function MetricCard({ metric }: { metric: ScorecardMetric }) {
  const status = metricStatus(metric);
  const display = formatScorecardValue(metric);

  const bands =
    metric.thresholds && metric.unit !== "unavailable" && metric.unit !== "compliance"
      ? metric.higherIsBetter
        ? [
            { label: "Fantastic", bound: `≥ ${formatBound(metric, metric.thresholds.fantastic)}` },
            { label: "Great", bound: `≥ ${formatBound(metric, metric.thresholds.great)}` },
            { label: "Fair", bound: `≥ ${formatBound(metric, metric.thresholds.fair)}` },
            { label: "Poor", bound: `< ${formatBound(metric, metric.thresholds.fair)}` },
          ]
        : [
            { label: "Fantastic", bound: `≤ ${formatBound(metric, metric.thresholds.fantastic)}` },
            { label: "Great", bound: `≤ ${formatBound(metric, metric.thresholds.great)}` },
            { label: "Fair", bound: `≤ ${formatBound(metric, metric.thresholds.fair)}` },
            { label: "Poor", bound: `> ${formatBound(metric, metric.thresholds.fair)}` },
          ]
      : [];

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {metric.shortName}
            </p>
            <CardTitle className="text-base">{metric.name}</CardTitle>
          </div>
          <ScoreStatusBadge status={status} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-4">
        <div>
          <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight">
            {display}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prior week not shown in DSP Console
          </p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{metric.description}</p>
        {bands.length > 0 ? (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {bands.map((band) => (
              <div key={band.label} className="flex justify-between gap-2">
                <dt>{band.label}</dt>
                <dd className="tabular-nums text-foreground/80">{band.bound}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </CardContent>
    </Card>
  );
}
