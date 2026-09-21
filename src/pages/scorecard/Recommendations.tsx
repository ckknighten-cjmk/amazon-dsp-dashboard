import { useMemo } from "react";
import { Lightbulb, MapPin, Users } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { driverRows, routeRows, weeklyScorecard } from "../../scorecard/data";
import { analyzeDrivers, analyzeRoutes, generateRecommendations } from "../../scorecard/engine";
import { METRIC_CATALOG } from "../../scorecard/metrics";
import type { RecommendationFocus } from "../../scorecard/types";
import { priorityStyles } from "../../scorecard/ui";

const FOCUS_COPY: Record<RecommendationFocus, string> = {
  dcr: "Improve DCR",
  pod: "Improve POD",
  cdf: "Improve CDF",
  safety: "Improve safety score",
};

export default function Recommendations() {
  const recommendations = useMemo(() => {
    const drivers = analyzeDrivers(driverRows, weeklyScorecard.metrics);
    const routes = analyzeRoutes(routeRows, weeklyScorecard.metrics);
    return generateRecommendations(weeklyScorecard.metrics, drivers, routes);
  }, []);

  return (
    <div>
      <PageHeader
        title="AI Recommendations"
        description="Action plans generated from current scorecard gaps, driver contributions, and high-risk routes."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {recommendations.map((rec) => (
          <article key={rec.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="stat-label">{FOCUS_COPY[rec.focus]}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{rec.title}</h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${priorityStyles[rec.priority]}`}>
                {rec.priority} priority
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{rec.rationale}</p>
            <p className="mt-2 text-sm text-brand-teal">
              <Lightbulb className="mr-1 inline h-4 w-4" />
              {rec.expectedImpact}
            </p>

            <ol className="mt-4 space-y-2">
              {rec.actions.map((action, index) => (
                <li key={action} className="flex gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-xs font-semibold text-brand-orange">
                    {index + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>

            <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {rec.affectedDrivers.length ? rec.affectedDrivers.join(", ") : "Fleet-wide"}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {rec.affectedRoutes.length
                  ? rec.affectedRoutes.join(", ")
                  : METRIC_CATALOG[rec.focus === "safety" ? "safety" : rec.focus].label}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
