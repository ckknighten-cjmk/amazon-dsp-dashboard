import { describe, expect, it } from "vitest";
import { seedDb } from "../data/seed";
import { filterDatabase } from "./aggregations";
import { buildDamageIntelligence } from "./damage";

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

  it("scopes damage events to a station", () => {
    const scoped = filterDatabase(seedDb, "stn-dla7");
    expect(scoped.damageEvents.every((row) => row.station_id === "stn-dla7")).toBe(true);
    expect(scoped.dvics.every((row) => row.station_id === "stn-dla7")).toBe(true);
    const view = buildDamageIntelligence(scoped);
    expect(view.byVehicle.every((row) => row.stationCode === "DLA7")).toBe(true);
  });
});
