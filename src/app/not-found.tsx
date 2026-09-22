import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div>
      <PageHeader
        title="Not found"
        description="That route, page, or record is not in the DNA4 station snapshot."
        actions={
          <Button nativeButton={false} render={<Link href="/" />}>Back to overview</Button>
        }
      />
    </div>
  );
}
