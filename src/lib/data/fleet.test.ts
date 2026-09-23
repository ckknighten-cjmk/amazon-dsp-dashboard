import assert from "node:assert/strict";
import test from "node:test";
import { getFleetYard, getVehicles } from "./index";
import { mapConsoleFleet, mapConsoleStatus, mapConsoleType, yardFromSeed } from "./fleet";

test("DNA4 My vehicles replaces the mock yard", () => {
  const yard = getFleetYard();
  assert.equal(yard.origin, "console");
  assert.equal(yard.vehicles.length, 56);
  assert.equal(getVehicles().length, 56);
  assert.match(yard.nav, /My vehicles/);
  assert.equal(yard.capturedAt, "2026-09-23T00:33:00-05:00");

  const unit11 = yard.vehicles.find((van) => van.unitId === "11");
  assert.ok(unit11);
  assert.equal(unit11.plate, "CP81075");
  assert.equal(unit11.vin, "3C6MRVJG5ME549360");
  assert.equal(unit11.makeModel, "Ram, ProMaster");
  assert.equal(unit11.status, "oos");
  assert.equal(unit11.consoleStatus, "Grounded");
  assert.equal(unit11.year, null);
  assert.equal(unit11.mileage, null);
  assert.equal(unit11.lastInspection, null);

  const edv = yard.vehicles.find((van) => van.vin === "7FCEHEB21TN050434");
  assert.ok(edv);
  assert.equal(edv.unitId, "");
  assert.equal(edv.plate, "016775A79");
  assert.equal(edv.type, "edv");
  assert.equal(edv.makeModel, "Rivian, EDV 700");

  assert.equal(yard.vehicles.filter((van) => van.type === "edv").length, 32);
  assert.equal(yard.vehicles.filter((van) => van.status === "oos").length, 11);
  assert.ok(yard.vehicles.every((van) => van.year == null && van.mileage == null));
  assert.ok(yard.vehicles.every((van) => van.origin === "console"));
  assert.equal(
    yard.vehicles.filter((van) => van.plate === "TN 441-CJM").length,
    0
  );
});

test("an empty fleet seed keeps the mock yard and does not invent vans", () => {
  const yard = yardFromSeed({
    source: "empty",
    nav: "Administration → Fleet → My vehicles",
    note: "Do not invent rows.",
    vehicles: [],
  });
  assert.equal(yard.origin, "mock");
  assert.equal(yard.vehicles.length, 22);
  assert.ok(yard.vehicles.every((van) => van.origin === "mock"));
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
      year: null,
      mileage: null,
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
  assert.equal(mapConsoleType("2dr Step Van", "Rivian, EDV 700"), "edv");
  assert.equal(mapConsoleType("Step van", "Ford"), "step_van");
  assert.equal(mapConsoleStatus("Out of service", null), "oos");
  assert.equal(mapConsoleStatus("In maintenance", null), "maintenance");
  assert.equal(mapConsoleStatus("Operational", "CX238"), "on_route");
});
