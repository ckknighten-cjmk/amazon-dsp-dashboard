import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseStationExportStamp, seedAsOfLabel, seedCapturedLabel } from "./format";

describe("seedCapturedLabel", () => {
  it("labels a zoned Console capture and skips missing or naive timestamps", () => {
    assert.equal(seedCapturedLabel(undefined), undefined);
    assert.equal(seedCapturedLabel(null), undefined);
    assert.equal(seedCapturedLabel(""), undefined);
    assert.equal(seedCapturedLabel("   "), undefined);
    assert.equal(seedCapturedLabel("2026-09-12T23:59:00"), undefined);

    const labeled = seedCapturedLabel("2026-09-28T20:09:00-05:00");
    assert.equal(labeled, "Seed captured Sep 28, 2026, 8:09 PM CDT");
    assert.equal(
      seedCapturedLabel("2026-09-23T12:01:44.632Z"),
      "Seed captured Sep 23, 2026, 7:01 AM CDT"
    );
  });

  it("labels a naive calendar date without inventing a clock", () => {
    assert.equal(seedAsOfLabel("2026-09-12T23:59:00"), "Seed as of Sep 12, 2026");
    assert.equal(
      seedAsOfLabel("2026-09-28T20:09:00-05:00"),
      "Seed captured Sep 28, 2026, 8:09 PM CDT"
    );
  });

  it("reads an Amazon schedule export stamp as Chicago wall time", () => {
    assert.equal(parseStationExportStamp("10/13/26, 7:51:45 PM"), "2026-10-14T00:51:45.000Z");
    assert.equal(parseStationExportStamp("9/22/26, 8:59:54 PM"), "2026-09-23T01:59:54.000Z");
    assert.equal(parseStationExportStamp("not a stamp"), undefined);
  });
});
