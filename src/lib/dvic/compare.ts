import type { DvicDamage, DvicDayPair, DvicInspection, DvicPhase, NewDamageAlert } from "@/lib/dvic/types";

export function damageKey(item: { area: string; detail: string }) {
  return `${item.area.trim().toLowerCase()}|${item.detail.trim().toLowerCase()}`;
}

/**
 * Post-trip (and AVI post-trip) damage that was not on a pre-trip for the
 * same vehicle and service day. Matching ignores case and surrounding space.
 * An item is new when no pre-trip listed it, including when the capture has
 * no pre-trip for that vehicle.
 */
export function findNewDamage(inspections: readonly DvicInspection[]): NewDamageAlert[] {
  const groups = new Map<string, DvicInspection[]>();
  for (const inspection of inspections) {
    const key = `${inspection.vehicleUnit}\0${inspection.serviceDate}`;
    const list = groups.get(key) ?? [];
    list.push(inspection);
    groups.set(key, list);
  }

  const alerts: NewDamageAlert[] = [];
  for (const list of groups.values()) {
    const hadPre = list.some((inspection) => inspection.phase === "pre_trip");
    const preKeys = new Set(
      list
        .filter((inspection) => inspection.phase === "pre_trip")
        .flatMap((inspection) => inspection.damage.map(damageKey))
    );
    for (const inspection of list) {
      if (inspection.phase === "pre_trip") continue;
      for (const item of inspection.damage) {
        if (preKeys.has(damageKey(item))) continue;
        alerts.push({
          id: `${inspection.id}:${damageKey(item)}`,
          vehicleUnit: inspection.vehicleUnit,
          serviceDate: inspection.serviceDate,
          phase: inspection.phase,
          area: item.area,
          detail: item.detail,
          reason: hadPre
            ? "Not on the pre-trip for this vehicle and day."
            : "No pre-trip was in the capture for this vehicle and day.",
        });
      }
    }
  }
  return alerts;
}

function damageFor(list: readonly DvicInspection[], phase: DvicPhase): DvicDamage[] {
  return list.filter((inspection) => inspection.phase === phase).flatMap((inspection) => inspection.damage);
}

export function damageSummary(items: readonly DvicDamage[]) {
  return items.map((item) => `${item.area.trim()}: ${item.detail.trim()}`).join("; ");
}

/** Group inspections by vehicle and service day so pre-trip and post-trip sit together. */
export function pairInspections(inspections: readonly DvicInspection[]): DvicDayPair[] {
  const groups = new Map<string, DvicInspection[]>();
  for (const inspection of inspections) {
    const key = `${inspection.vehicleUnit}\0${inspection.serviceDate}`;
    const list = groups.get(key) ?? [];
    list.push(inspection);
    groups.set(key, list);
  }

  const alertsByPair = new Map<string, NewDamageAlert[]>();
  for (const alert of findNewDamage(inspections)) {
    const key = `${alert.vehicleUnit}\0${alert.serviceDate}`;
    const list = alertsByPair.get(key) ?? [];
    list.push(alert);
    alertsByPair.set(key, list);
  }

  return [...groups.values()]
    .map((list) => {
      const sample = list[0];
      const key = `${sample.vehicleUnit}\0${sample.serviceDate}`;
      return {
        id: `${sample.vehicleUnit}:${sample.serviceDate}`,
        vehicleUnit: sample.vehicleUnit,
        serviceDate: sample.serviceDate,
        hadPreTrip: list.some((inspection) => inspection.phase === "pre_trip"),
        hadPostTrip: list.some((inspection) => inspection.phase === "post_trip"),
        hadAviPostTrip: list.some((inspection) => inspection.phase === "avi_post_trip"),
        preTrip: damageFor(list, "pre_trip"),
        postTrip: damageFor(list, "post_trip"),
        aviPostTrip: damageFor(list, "avi_post_trip"),
        newDamage: alertsByPair.get(key) ?? [],
      };
    })
    .sort(
      (a, b) =>
        a.serviceDate.localeCompare(b.serviceDate) || a.vehicleUnit.localeCompare(b.vehicleUnit)
    );
}
