import assert from "node:assert/strict";
import test from "node:test";
import { getDrivers } from "./index";
import {
  censusEmployees,
  censusMatchScore,
  employmentStatus,
  matchCensusEmployee,
  publishedPhone,
} from "./census";
import { filterRoster } from "./roster";

test("census file is the ADP export and phones are only the published ones", () => {
  assert.equal(censusEmployees.length, 526);
  const withPhone = censusEmployees.filter((employee) => employee.phone.trim());
  assert.equal(withPhone.length, 126);
  assert.ok(censusEmployees.every((employee) => !employee.mobile.trim()));
  assert.equal(censusEmployees.filter((employee) => employmentStatus(employee.status) === "active").length, 119);
});

test("middle initials match and a contradictory middle does not", () => {
  assert.ok(censusMatchScore("Aaron Calvin Davis", "AARON C DAVIS") >= 90);
  assert.equal(censusMatchScore("Aaron Lee Davis", "AARON C DAVIS"), 0);
  assert.equal(censusMatchScore("Aaron Calvin Davis", "AARON M HINES"), 0);
});

test("active census contact wins and a terminated namesake does not supply the phone", () => {
  const rows = [
    {
      name: "BRIANA MOSELY",
      positionId: "active",
      phone: "",
      mobile: "",
      email: "briana@example.com",
      status: "A - Active",
    },
    {
      name: "BROADRICK MOSLEY",
      positionId: "terminated",
      phone: "1-901-2385020",
      mobile: "",
      email: "brody@example.com",
      status: "T - Terminated",
    },
  ];
  const match = matchCensusEmployee("briana Maeleah Mosley", rows);
  assert.equal(match?.positionId, "active");
  assert.equal(publishedPhone(match!), undefined);
});

test("roster phones and emails are copied only from the matched census row", () => {
  const drivers = getDrivers();
  const phones = new Set(censusEmployees.map((employee) => employee.phone.trim()).filter(Boolean));
  for (const driver of drivers) {
    if (!driver.phone) continue;
    assert.ok(phones.has(driver.phone), driver.phone);
    assert.ok(driver.censusName);
  }

  const aaron = getDrivers().find((driver) => driver.transporterId === "AD3O3G0B92UUS");
  assert.equal(aaron?.censusName, "AARON C DAVIS");
  assert.equal(aaron?.email, "aaronmacalot@gmail.com");
  assert.equal(aaron?.phone, undefined);
  assert.equal(aaron?.employmentStatus, "active");

  const briana = drivers.find((driver) => driver.name.toLowerCase().startsWith("briana"));
  assert.ok(briana);
  assert.equal(briana.email, "brianamosley12@gmail.com");
  assert.equal(briana.phone, undefined);
  assert.notEqual(briana.phone, "1-901-2385020");

  const donald = drivers.find((driver) => driver.name.toLowerCase().includes("donald fitzgerald"));
  assert.ok(donald);
  assert.equal(donald.phone, undefined);
  assert.equal(donald.email, undefined);
  assert.equal(donald.censusName, undefined);

  const withPhone = drivers.filter((driver) => driver.phone);
  assert.ok(withPhone.length > 0);
  assert.ok(withPhone.length < 126);
  assert.ok(withPhone.every((driver) => driver.censusName));

  const primary = filterRoster(drivers, { employment: "active" });
  assert.ok(primary.length > 40);
  assert.ok(primary.every((driver) => !driver.employmentStatus || driver.employmentStatus === "active"));
  assert.ok(primary.some((driver) => driver.phone));
  const terminated = filterRoster(drivers, { employment: "terminated" });
  assert.ok(terminated.every((driver) => driver.employmentStatus === "terminated"));
});
