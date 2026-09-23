import assert from "node:assert/strict";
import test from "node:test";
import { getFleetYard, getVehicles } from "./index";
import { mapConsoleFleet, mapConsoleStatus, mapConsoleType } from "./fleet";

test("empty DNA4 fleet seed keeps the mock yard and does not invent vans", () => {
  const yard = getFleetYard();
  assert.equal(yard.origin, "mock");
  assert.equal(yard.vehicles.length, 22);
  assert.equal(getVehicles().length, 22);
  assert.ok(yard.vehicles.every((van) => van.origin === "mock"));
  assert.match(yard.nav, /My vehicles/);
  assert.match(yard.note, /Do not invent/);
});

test("a Console fleet row keeps published fields and leaves year and mileage empty", () => {
  const [van] = mapConsoleFleet([
    {
      unit: "EDV-100",
      plate: "TN EXAMPLE",
      makeModel: "Rivian EDV 700",
      vin: "1TESTVIN000000000",
      ownership: "Amazon",
      type: "Electric delivery van",
      status: "Operational",
      statusReason: null,
      lastRouteCompleted: "CX240",
      assignedRoute: null,
    },
  ]);
  assert.equal(van.unitId, "EDV-100");
  assert.equal(van.vin, "1TESTVIN000000000");
  assert.equal(van.plate, "TN EXAMPLE");
  assert.equal(van.makeModel, "Rivian EDV 700");
  assert.equal(van.ownership, "Amazon");
  assert.equal(van.type, "edv");
  assert.equal(van.status, "ready");
  assert.equal(van.year, null);
  assert.equal(van.mileage, null);
  assert.equal(van.lastInspection, null);
  assert.equal(van.origin, "console");
  assert.equal(mapConsoleType("Cargo van", "Ford Transit"), "rental_cargo");
  assert.equal(mapConsoleType("Step van", ""), "step_van");
  assert.equal(mapConsoleStatus("Out of service", null), "oos");
  assert.equal(mapConsoleStatus("In maintenance", null), "maintenance");
  assert.equal(mapConsoleStatus("Operational", "CX238"), "on_route");
});
