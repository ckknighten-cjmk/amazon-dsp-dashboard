import { PageHeader, TableSkeleton } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Loading station…" description="Loading DNA4 Delivery Execution." />
      <div className="mb-5 grid gap-2 lg:grid-cols-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-5">
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
}
