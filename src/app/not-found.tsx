import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { currentStation } from "@/lib/station-request";
import { hrefWithStation } from "@/lib/stations";

export default async function NotFound() {
  const station = await currentStation();
  return (
    <div>
      <PageHeader
        title="Not found"
        description={`That route, page, or record is not in the ${station} station snapshot.`}
        refresh={false}
        actions={
          <Button nativeButton={false} render={<Link href={hrefWithStation("/", station)} />}>Back to overview</Button>
        }
      />
    </div>
  );
}
