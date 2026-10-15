import assert from "node:assert/strict";
import test from "node:test";
import {
  assessDriverChecks,
  parseCategoryCell,
  parseFleetIssueCapture,
  parseInspectionSource,
  parseRepairStatus,
  parseVehicleCell,
} from "./parse";
import { parseStationDateTime, stationCalendarDay } from "./time";

const EDV_VEHICLE = "EDV 20\n\nY142870\n\nRivian, EDV 700\n\n7FCEHEB23SN031818";
const PLATE_ONLY = "BMN4364\n\nRam, ProMaster\n\n3C6LRVDG5PE511591";
const LIGHTS =
  "Lights and light covers\n\nBack Side\n\nAny lights or light covers are cracked (leaving hole or void), missing, or not working properly";

test("parsing splits vehicle, category, repair, and Chicago timestamps", () => {
  const named = parseVehicleCell(EDV_VEHICLE, 1);
  assert.deepEqual(named, {
    vehicleName: "EDV 20",
    plate: "Y142870",
    makeModel: "Rivian, EDV 700",
    vin: "7FCEHEB23SN031818",
  });

  const unnamed = parseVehicleCell(PLATE_ONLY, 9);
  assert.equal(unnamed.vehicleName, "");
  assert.equal(unnamed.plate, "BMN4364");
  assert.equal(unnamed.makeModel, "Ram, ProMaster");
  assert.equal(unnamed.vin, "3C6LRVDG5PE511591");

  assert.deepEqual(parseCategoryCell(LIGHTS, 1), {
    component: "Lights and light covers",
    side: "Back Side",
    description:
      "Any lights or light covers are cracked (leaving hole or void), missing, or not working properly",
  });
  assert.deepEqual(parseCategoryCell("Light repair\n\nKeys", 3), {
    component: "Light repair",
    side: null,
    description: "Keys",
  });
  assert.deepEqual(
    parseRepairStatus("Rejected\n\nVehicle has outstanding WTG defects as of the latest PAVE"),
    {
      repairStatus: "Rejected",
      repairNote: "Vehicle has outstanding WTG defects as of the latest PAVE",
    }
  );

  const created = parseStationDateTime("10/14/2026\n\n7:01 PM");
  assert.equal(created, "2026-10-14T19:01:00-05:00");
  assert.equal(stationCalendarDay(created), "2026-10-14");
  assert.equal(parseStationDateTime("12/28/2023\n\n12:00 PM"), "2023-12-28T12:00:00-06:00");
  assert.equal(parseStationDateTime("10/14/2026\n\n12:00 AM"), "2026-10-14T00:00:00-05:00");
});

test("driver-checks-passed flag requires both named DVIC checks to pass", () => {
  const both = assessDriverChecks(
    "DVIC: Post-trip 07:02 PM darome josiah boyland Passed; DVIC: Pre-trip 10:07 AM darome josiah boyland Passed"
  );
  assert.equal(both.preTripPassed, true);
  assert.equal(both.postTripPassed, true);
  assert.equal(both.damageFoundAfterDriverChecksPassed, true);

  const preOnly = assessDriverChecks(
    "DVIC: Pre-trip 10:14 AM Dorian cLYDE Tyler Passed (and another Passed DVIC by same inspector just before the AVI)"
  );
  assert.equal(preOnly.preTripPassed, true);
  assert.equal(preOnly.postTripPassed, null);
  assert.equal(preOnly.damageFoundAfterDriverChecksPassed, false);

  const failed = assessDriverChecks(
    "DVIC: Pre-trip 10:07 AM darome josiah boyland Failed; DVIC: Post-trip 07:02 PM darome josiah boyland Passed"
  );
  assert.equal(failed.preTripPassed, false);
  assert.equal(failed.damageFoundAfterDriverChecksPassed, false);

  assert.equal(parseInspectionSource("AVI: 10/14/2026", "10/14/2026 06:58 PM, AVI, AVI SCANNER, High Severity Defect, Lights and light covers"), "AVI");
  assert.equal(parseInspectionSource("DVIC pre-trip: 10/14/2026", "10/14/2026 10:07 AM, DVIC, Driver, Pre-trip"), "DVIC pre-trip");
  assert.equal(parseInspectionSource("DVIC post-trip: 10/14/2026", "10/14/2026 07:02 PM, DVIC, Driver, Post-trip"), "DVIC post-trip");
});

test("a capture keeps published fields and attaches vehicle-page detail only on a matching row", () => {
  const snapshot = parseFleetIssueCapture(
    {
      capturedAt: "2026-10-15T04:15:40Z",
      station: "DNA4 (Memphis (DNA4)- Amazon.com), CJMK Inc.",
      source: "https://logistics.amazon.com/fleet-management/?station=DNA4#issues",
      totalResultsShown: "Total results: 2",
      newDefectDetails: [
        {
          vehicle: "EDV 20 / Y142870 (OR) / 2025 Rivian, EDV 700 / 7FCEHEB23SN031818",
          detailUrl: "https://logistics.amazon.com/fleet-management/vehicles/example?vin=7FCEHEB23SN031818",
          issue:
            "Lights and light covers / Back Side / Any lights or light covers are cracked (leaving hole or void), missing, or not working properly",
          severity: "High",
          sourceAndDateCreated: "AVI: 10/14/2026",
          status: "Needs repair",
          inspection: "10/14/2026 06:58 PM, AVI, AVI SCANNER, High Severity Defect, Lights and light covers",
          photos: "No inspection photos available",
          comments: "none shown",
          otherInspectionsToday:
            "DVIC: Post-trip 07:02 PM darome josiah boyland Passed; DVIC: Pre-trip 10:07 AM darome josiah boyland Passed",
        },
      ],
      rows: [
        {
          rowId: 1,
          Vehicle: EDV_VEHICLE,
          "Created date & time": "10/14/2026\n\n7:01 PM",
          "Operational status": "Grounded",
          "Issue type": "Inspection defects",
          "Category and description": LIGHTS,
          Severity: "High",
          "Repair status": "Needs repair",
          "Ownership status": "Active",
        },
        {
          rowId: 3,
          Vehicle: "EDV 14\n\nY142855\n\nRivian, EDV 700\n\n7FCEHEB29SN031824",
          "Created date & time": "10/14/2026\n\n8:11 AM",
          "Operational status": "Grounded",
          "Issue type": "Self reported maintenance",
          "Category and description": "Light repair\n\nKeys",
          Severity: "Low",
          "Repair status": "Under repair",
          "Ownership status": "Active",
        },
      ],
    },
    { date: "2026-10-14" }
  );

  assert.equal(snapshot.captureDay, "2026-10-14");
  assert.equal(snapshot.issues.length, 2);
  const edv = snapshot.issues[0];
  assert.equal(edv.createdAt, "2026-10-14T19:01:00-05:00");
  assert.equal(edv.detail?.sourceInspection, "AVI");
  assert.equal(edv.detail?.inspector, "AVI SCANNER");
  assert.equal(edv.detail?.foundAt, "2026-10-14T18:58:00-05:00");
  assert.equal(edv.detail?.damageFoundAfterDriverChecksPassed, true);
  assert.equal(snapshot.issues[1].detail, undefined);
  assert.equal(snapshot.issues[1].side, null);
  assert.equal(snapshot.issues[1].description, "Keys");
});
