import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seedCapturedLabel } from "./format";

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
});
