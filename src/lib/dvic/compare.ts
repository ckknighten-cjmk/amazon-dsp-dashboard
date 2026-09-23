import type { DvicInspection, NewDamageAlert } from "@/lib/dvic/types";

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
