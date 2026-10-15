import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { selectCatalog } from "@/lib/fleet-issues/detect";
import type { FleetIssueCatalog, FleetIssueSnapshot } from "@/lib/fleet-issues/types";

const FILE_NAME = /^issues-(\d{4}-\d{2}-\d{2})\.json$/;

export const FLEET_ISSUES_DIR = path.join(process.cwd(), "src/lib/data/seed/fleet-issues");

/**
 * Load every `issues-YYYY-MM-DD.json` in the seed directory.
 * Adding a newer dated file makes it the snapshot the Fleet page uses.
 */
export function loadFleetIssueSnapshots(dir = FLEET_ISSUES_DIR): FleetIssueSnapshot[] {
  const names = readdirSync(dir)
    .filter((name) => FILE_NAME.test(name))
    .sort();
  return names.map((name) => {
    const date = name.match(FILE_NAME)?.[1];
    if (!date) throw new Error(`Unrecognized fleet issues file ${name}`);
    const snapshot = JSON.parse(readFileSync(path.join(dir, name), "utf8")) as FleetIssueSnapshot;
    if (snapshot.date !== date) {
      throw new Error(`Snapshot ${name} is dated ${snapshot.date}`);
    }
    return snapshot;
  });
}

export function loadFleetIssueCatalog(dir = FLEET_ISSUES_DIR): FleetIssueCatalog {
  return selectCatalog(loadFleetIssueSnapshots(dir));
}
