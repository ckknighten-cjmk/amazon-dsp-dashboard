import assert from "node:assert/strict";
import test from "node:test";
import { associateId, consoleDrivers, routes } from "./delivery-execution";
import { getDriver, getDrivers } from "./index";
import { adpDisplayName, filterRoster, matchSchedulePerson } from "./roster";

test("schedule name matching keeps a unique first and last name", () => {
  const people = [{ name: "Aaron Calvin Davis" }, { name: "Aaron marcellus Hines" }];
  assert.equal(matchSchedulePerson("Aaron Davis", people)?.name, "Aaron Calvin Davis");
  assert.equal(
    matchSchedulePerson("Aaron Davis", [{ name: "Aaron Calvin Davis" }, { name: "Aaron Lee Davis" }]),
    null
  );
});

test("ADP display names turn LAST, FIRST into First Last", () => {
  assert.equal(adpDisplayName("ACKER, MARY"), "Mary Acker");
  assert.equal(adpDisplayName("WEEKS JR, KOFI"), "Kofi Weeks JR");
  assert.equal(adpDisplayName("Lexie"), "Lexie");
});

test("active roster is the schedule union, not the Sep 25 board", () => {
  const drivers = getDrivers();
  const scheduled = drivers.filter((driver) => driver.rosterSource === "amazon-schedule");
  const adpOnly = drivers.filter((driver) => driver.rosterSource === "adp-only");
  const onBoard = drivers.filter((driver) => driver.routeIds.length > 0);

  assert.ok(drivers.length > 40);
  assert.equal(scheduled.length, 96);
  assert.equal(onBoard.length, consoleDrivers.length);
  assert.equal(consoleDrivers.length, 36);
  assert.ok(adpOnly.length > 0);
  assert.ok(adpOnly.every((driver) => !driver.transporterId));
  assert.equal(new Set(drivers.map((driver) => driver.id)).size, drivers.length);

  const onlyWeek38 = scheduled.filter(
    (driver) => driver.scheduleWeeks?.length === 1 && driver.scheduleWeeks[0] === 38
  );
  assert.equal(onlyWeek38.length, 2);
  assert.ok(onlyWeek38.every((driver) => driver.transporterId));

  const aaron = getDrivers().find((driver) => driver.transporterId === "AD3O3G0B92UUS");
  assert.equal(aaron?.name, "Aaron Calvin Davis");
  assert.equal(aaron?.routeIds.length, 0);

  const brandon = getDriver(associateId("Brandon Clark"));
  assert.equal(brandon?.name, "Brandon Michael Clark");
  assert.equal(brandon?.transporterId, "A3U0VHDQG06ZIH");
  assert.ok(brandon?.routeIds.length);

  for (const boardDriver of consoleDrivers) {
    const driver = getDriver(boardDriver.id);
    assert.ok(driver, boardDriver.name);
    assert.ok(driver.routeIds.length > 0);
  }
  for (const route of routes) {
    for (const id of route.associateIds) assert.ok(getDriver(id), id);
  }
});

test("search and source filters run on the full roster", () => {
  const drivers = getDrivers();
  const adpOnly = filterRoster(drivers, { source: "adp-only" });
  assert.equal(adpOnly.length, drivers.filter((driver) => driver.rosterSource === "adp-only").length);
  assert.ok(adpOnly.length > 0);
  assert.equal(filterRoster(drivers, { query: "adp only" }).length, adpOnly.length);

  const sample = adpOnly[0];
  const found = filterRoster(drivers, { query: sample.adpName ?? sample.name });
  assert.ok(found.some((driver) => driver.id === sample.id));

  const narrowed = filterRoster(drivers, { query: "aaron", source: "amazon-schedule" });
  assert.ok(narrowed.length > 0);
  assert.ok(narrowed.length < drivers.length);
  assert.ok(narrowed.every((driver) => driver.rosterSource === "amazon-schedule"));
});
