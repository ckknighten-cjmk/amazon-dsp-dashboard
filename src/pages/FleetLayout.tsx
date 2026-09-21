import { Outlet, useMatch } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import FleetSubnav from "../components/FleetSubnav";

export default function FleetLayout() {
  const detail = useMatch("/fleet/vehicles/:vehicleId");

  if (detail) return <Outlet />;

  return (
    <div>
      <PageHeader
        title="Fleet Readiness Command Center"
        description="Is tomorrow's fleet ready? Availability, grounding, DVIC defects, shop load, and cost to keep vans on the road."
      />
      <FleetSubnav />
      <Outlet />
    </div>
  );
}
