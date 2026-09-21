import { describe, expect, it } from "vitest";
import { seedDb } from "../data/seed";
import { filterDatabase } from "./aggregations";
import { buildDamageIntelligence, DAMAGE_REPORT_COLUMNS, WORKFLOW_NEXT } from "./damage";

describe("DVIC damage intelligence", () => {
  it("flags new damage this week with prior and next driver possession", () => {
    const view = buildDamageIntelligence(seedDb);
    expect(view.kpis[0].label).toBe("New damage this week");
    expect(view.newDamage.length).toBeGreaterThan(0);
    const door = view.newDamage.find((row) => row.id === "dmg-01");
    expect(door?.priorDriverName).toContain("Kwame");
    expect(door?.foundByName).toContain("Maya");
    expect(door?.responsibleName).toContain("Kwame");
    expect(door?.estimated_cost).toBe(420);
  });

  it("tracks progression separately from first-seen events", () => {
    const view = buildDamageIntelligence(seedDb);
    expect(seedDb.damageEvents.some((row) => row.detected_via === "progression" && row.parent_event_id === "dmg-02")).toBe(true);
    expect(view.unresolved.some((row) => row.vanId === "EV-218")).toBe(true);
  });

  it("rolls up unresolved cost, driver, and vehicle views", () => {
    const view = buildDamageIntelligence(seedDb);
    expect(view.unresolved.length).toBeGreaterThan(0);
    expect(view.byDriver.some((row) => row.name.includes("Petrova") || row.name.includes("Brooks") || row.name.includes("Osei"))).toBe(true);
    expect(view.byVehicle.some((row) => row.vanId === "EV-224")).toBe(true);
    expect(view.repairTrend.length).toBe(6);
    expect(view.photos.some((row) => row.compared_to_photo_id && (row.change_confidence ?? 0) > 0.8)).toBe(true);
  });

  it("scores severity, grounding, and approval workflow on the report", () => {
    const view = buildDamageIntelligence(seedDb);
    expect(view.kpis[4].label).toBe("Grounding recs");
    expect(view.grounding.some((row) => row.vanId === "EV-224" && row.severity_score === "ground_vehicle")).toBe(true);
    const door = view.reportRows.find((row) => row.id === "dmg-01");
    expect(door?.severity_score).toBe("minor");
    expect(door?.workflow_status).toBe("new");
    expect(door?.investigation_status).toBe("open");
    expect(door?.routeCode).toBe("CX-14");
    expect(door?.priorDriverName).toContain("Kwame");
    expect(door?.currentDriverName).toContain("Maya");
    expect(door?.beforePhoto?.is_baseline).toBe(true);
    expect(door?.afterPhoto?.compared_to_photo_id).toBe("ph-01a");
    expect(door?.estimated_cost).toBe(420);
    const crushed = view.reportRows.find((row) => row.id === "dmg-04");
    expect(crushed?.workflow_status).toBe("scheduled_repair");
    expect(crushed?.investigation_status).toBe("charged");
    expect(crushed?.grounding_recommended).toBe(true);
    expect(WORKFLOW_NEXT.new).toBe("under_review");
    expect(WORKFLOW_NEXT.repaired).toBeNull();
  });

  it("shows the seven damage report columns for each event", () => {
    expect([...DAMAGE_REPORT_COLUMNS]).toEqual([
      "Vehicle",
      "Date damage detected",
      "Previous driver",
      "Current driver",
      "Route",
      "Damage type",
      "Open investigation status",
    ]);
    const view = buildDamageIntelligence(seedDb);
    const door = view.reportRows.find((row) => row.id === "dmg-01");
    expect(door?.vanId).toBe("EV-210");
    expect(door?.detectedDate).toBe("2026-09-20");
    expect(door?.priorDriverName).toContain("Kwame");
    expect(door?.currentDriverName).toContain("Maya");
    expect(door?.routeCode).toBe("CX-14");
    expect(door?.damage_type).toBe("scrape");
    expect(door?.investigation_status).toBe("open");
    expect(view.openInvestigations.length).toBe(view.totals.openInvestigations);
    expect(view.openInvestigations.every((row) => row.investigation_status === "open" || row.investigation_status === "pending_driver")).toBe(true);
  });

  it("tracks severity, workflow, cost actuals, and mixed vehicle timelines", () => {
    const view = buildDamageIntelligence(seedDb);
    expect(view.kpis[2].label).toBe("Estimated repair cost");
    expect(view.severityBoard.map((row) => row.score)).toEqual(["minor", "moderate", "severe", "ground_vehicle"]);
    expect(view.severityBoard.every((row) => row.count >= 0)).toBe(true);
    expect(view.severityBoard.some((row) => row.score === "ground_vehicle" && row.count >= 2)).toBe(true);
    expect(view.severityBoard.some((row) => row.score === "severe" && row.count >= 1)).toBe(true);
    expect(view.workflowBoard.map((row) => row.label)).toEqual([
      "New",
      "Under review",
      "Approved",
      "Scheduled repair",
      "Repaired",
    ]);
    expect(view.workflowBoard.some((row) => row.status === "new" && row.rows.length > 0)).toBe(true);
    expect(view.byDriver.some((row) => typeof row.actual === "number")).toBe(true);
    expect(view.byVehicle.some((row) => row.vanId === "EV-224" && row.estimated >= 4180)).toBe(true);
    const ev210 = view.vehicleTimelines.find((row) => row.vanId === "EV-210");
    expect(ev210?.dvicCount).toBeGreaterThan(0);
    expect(ev210?.damageCount).toBeGreaterThan(0);
    expect(ev210?.entries.some((entry) => entry.kind === "dvic")).toBe(true);
    expect(ev210?.entries.some((entry) => entry.kind === "damage")).toBe(true);
    const ev216 = view.vehicleTimelines.find((row) => row.vanId === "EV-216");
    expect(ev216?.entries.some((entry) => entry.kind === "repair")).toBe(true);
    expect(seedDb.damagePhotos.some((row) => row.id === "ph-01b" && row.bbox_json?.w && row.mask_storage_path)).toBe(true);
  });

  it("scopes damage events to a station", () => {
    const scoped = filterDatabase(seedDb, "stn-dla7");
    expect(scoped.damageEvents.every((row) => row.station_id === "stn-dla7")).toBe(true);
    expect(scoped.dvics.every((row) => row.station_id === "stn-dla7")).toBe(true);
    const view = buildDamageIntelligence(scoped);
    expect(view.byVehicle.every((row) => row.stationCode === "DLA7")).toBe(true);
  });
});
