import type { Standing } from "../types";
import { standingStyles, titleCase } from "../ui";

export default function MetricStatusBadge({ standing }: { standing: Standing }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${standingStyles[standing]}`}>
      {titleCase(standing)}
    </span>
  );
}
