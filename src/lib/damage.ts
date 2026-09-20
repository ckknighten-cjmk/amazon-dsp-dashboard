import { TODAY, WEEK_START } from "../data/seed";
import type { Kpi, SeedDatabase } from "../types/database";
import { addDays, formatNumber, formatUsd, formatUsdCompact, round2, sum } from "./format";

export const ZONE_LABEL: Record<SeedDatabase["damageEvents"][number]["zone"], string> = {
  front_bumper: "Front bumper",
  rear_bumper: "Rear bumper",
  driver_door: "Driver door",
  passenger_door: "Passenger door",
  hood: "Hood",
  roof: "Roof",
  left_quarter: "Left quarter",
  right_quarter: "Right quarter",
  windshield: "Windshield",
  mirror_left: "Left mirror",
  mirror_right: "Right mirror",
  tire_lf: "Tire LF",
  tire_lr: "Tire LR",
  interior: "Interior",
};

function driverName(db: SeedDatabase, id: string | null): string {
  if (!id) return "Unassigned";
  return db.drivers.find((row) => row.id === id)?.full_name ?? id;
}

function vanId(db: SeedDatabase, id: string): string {
  return db.vehicles.find((row) => row.id === id)?.van_id ?? id;
}

function stationCode(db: SeedDatabase, id: string): string {
  return db.stations.find((row) => row.id === id)?.code ?? "";
}

export function buildDamageIntelligence(db: SeedDatabase) {
  const newThisWeek = db.damageEvents.filter(
    (event) => event.first_seen_at.slice(0, 10) >= WEEK_START && event.detected_via !== "progression" && event.status !== "resolved",
  );
  const unresolved = db.damageEvents.filter((event) => event.status !== "resolved" && !event.parent_event_id);
  const progressing = db.damageEvents.filter((event) => event.detected_via === "progression" || event.status === "progressing");
  const openCost = sum(
    unresolved.map((event) => {
      const latest = db.damageEvents
        .filter((row) => row.id === event.id || row.parent_event_id === event.id)
        .sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at))[0];
      return latest?.estimated_cost ?? event.estimated_cost;
    }),
  );

  const kpis: Kpi[] = [
    {
      label: "New damage this week",
      value: String(newThisWeek.length),
      delta: `${progressing.length} progressing`,
      trend: newThisWeek.length ? "down" : "up",
      hint: `Since ${WEEK_START}`,
      favorable: "down",
    },
    {
      label: "Unresolved",
      value: String(unresolved.length),
      delta: formatUsdCompact(openCost),
      trend: unresolved.length ? "down" : "up",
      hint: "Open estimate",
      favorable: "down",
    },
    {
      label: "Repair quotes",
      value: formatUsdCompact(sum(db.maintenanceRepairs.filter((row) => row.status !== "cancelled").map((row) => row.quoted_cost))),
      delta: `${db.maintenanceRepairs.filter((row) => row.status === "in_progress" || row.status === "approved").length} in shop`,
      trend: "down",
      hint: "Quoted pipeline",
      favorable: "down",
    },
    {
      label: "AI compared photos",
      value: `${db.damagePhotos.filter((row) => row.compared_to_photo_id).length}/${db.damagePhotos.length}`,
      delta: `${db.damagePhotos.filter((row) => row.embedding_status === "ready").length} embeddings ready`,
      trend: "up",
      hint: "Photo comparison placeholders",
      favorable: "up",
    },
    {
      label: "Grounding recs",
      value: String(db.damageEvents.filter((row) => row.grounding_recommended && !row.parent_event_id).length),
      delta: `${db.damageEvents.filter((row) => row.severity_score === "ground_vehicle").length} ground-score`,
      trend: "down",
      hint: "Hold before next wave",
      favorable: "down",
    },
  ];

  const enriched = db.damageEvents
    .map((event) => {
      const dvic = db.dvics.find((row) => row.id === event.dvic_id);
      const prior = db.dvics.find((row) => row.id === event.prior_dvic_id);
      const photos = db.damagePhotos.filter((row) => row.damage_event_id === event.id);
      const review = db.damageReviews.find((row) => row.damage_event_id === event.id);
      const repair = db.maintenanceRepairs.find((row) => row.damage_event_id === event.id);
      const workOrder = db.maintenance.find((row) => row.id === event.maintenance_order_id);
      const route = event.route_id
        ? db.routes.find((row) => row.id === event.route_id)
        : db.routes.find((row) => row.vehicle_id === event.vehicle_id);
      const beforePhoto = photos.find((row) => row.is_baseline) ?? db.damagePhotos.find((row) => row.vehicle_id === event.vehicle_id && row.zone === event.zone && row.is_baseline);
      const afterPhoto = photos.find((row) => !row.is_baseline) ?? photos[photos.length - 1];
      return {
        ...event,
        vanId: vanId(db, event.vehicle_id),
        stationCode: stationCode(db, event.station_id),
        zoneLabel: ZONE_LABEL[event.zone],
        responsibleName: driverName(db, event.responsible_driver_id),
        priorDriverName: driverName(db, event.prior_driver_id),
        nextDriverName: driverName(db, event.next_driver_id),
        foundByName: driverName(db, dvic?.driver_id ?? null),
        currentDriverName: driverName(db, event.next_driver_id ?? dvic?.driver_id ?? null),
        priorInspectedAt: prior?.inspected_at ?? null,
        foundAt: dvic?.inspected_at ?? event.first_seen_at,
        detectedDate: event.first_seen_at.slice(0, 10),
        priorShift: prior ? `${prior.shift_type.replace("_", " ")} · ${prior.service_date}` : "No prior DVIC",
        foundShift: dvic ? `${dvic.shift_type.replace("_", " ")} · ${dvic.service_date}` : event.first_seen_at.slice(0, 10),
        routeCode: route?.route_code ?? "—",
        photos,
        beforePhoto: beforePhoto ?? null,
        afterPhoto: afterPhoto ?? null,
        review,
        repair,
        workOrder: workOrder?.work_order ?? null,
        actualCost: repair?.actual_cost ?? null,
      };
    })
    .sort((a, b) => b.first_seen_at.localeCompare(a.first_seen_at));

  const newDamage = enriched.filter((event) => newThisWeek.some((row) => row.id === event.id));
  const unresolvedRows = enriched.filter((event) => unresolved.some((row) => row.id === event.id));

  const byDriver = Object.values(
    enriched
      .filter((event) => !event.parent_event_id)
      .reduce<Record<string, { id: string; name: string; events: number; newThisWeek: number; estimated: number; unresolved: number }>>(
        (acc, event) => {
          const key = event.responsible_driver_id ?? "unassigned";
          if (!acc[key]) {
            acc[key] = { id: key, name: event.responsibleName, events: 0, newThisWeek: 0, estimated: 0, unresolved: 0 };
          }
          acc[key].events += 1;
          acc[key].estimated += event.estimated_cost;
          if (event.status !== "resolved") acc[key].unresolved += 1;
          if (newThisWeek.some((row) => row.id === event.id)) acc[key].newThisWeek += 1;
          return acc;
        },
        {},
      ),
  ).sort((a, b) => b.estimated - a.estimated);

  const byVehicle = Object.values(
    enriched
      .filter((event) => !event.parent_event_id)
      .reduce<Record<string, { id: string; vanId: string; stationCode: string; events: number; unresolved: number; estimated: number; latest: string }>>(
        (acc, event) => {
          if (!acc[event.vehicle_id]) {
            acc[event.vehicle_id] = {
              id: event.vehicle_id,
              vanId: event.vanId,
              stationCode: event.stationCode,
              events: 0,
              unresolved: 0,
              estimated: 0,
              latest: event.last_seen_at,
            };
          }
          acc[event.vehicle_id].events += 1;
          acc[event.vehicle_id].estimated += event.estimated_cost;
          if (event.status !== "resolved") acc[event.vehicle_id].unresolved += 1;
          if (event.last_seen_at > acc[event.vehicle_id].latest) acc[event.vehicle_id].latest = event.last_seen_at;
          return acc;
        },
        {},
      ),
  ).sort((a, b) => b.estimated - a.estimated);

  const repairTrend = [0, 1, 2, 3, 4, 5].map((offset) => {
    const start = addDays(WEEK_START, -7 * (5 - offset));
    const end = addDays(start, 6);
    const rows = db.maintenanceRepairs.filter((row) => row.scheduled_date >= start && row.scheduled_date <= end);
    return {
      week: start.slice(5),
      quoted: round2(sum(rows.map((row) => row.quoted_cost))),
      actual: round2(sum(rows.filter((row) => row.actual_cost !== null).map((row) => row.actual_cost ?? 0))),
      repairs: rows.length,
    };
  });

  const timeline = [...db.dvics]
    .sort((a, b) => b.inspected_at.localeCompare(a.inspected_at))
    .map((dvic) => {
      const events = enriched.filter((event) => event.dvic_id === dvic.id);
      return {
        ...dvic,
        vanId: vanId(db, dvic.vehicle_id),
        stationCode: stationCode(db, dvic.station_id),
        driverName: driverName(db, dvic.driver_id),
        events,
      };
    });

  const grounding = enriched.filter((event) => event.grounding_recommended && !event.parent_event_id);
  const reportRows = enriched.filter((event) => !event.parent_event_id);
  const pairs = reportRows.filter((event) => event.beforePhoto || event.afterPhoto);

  return {
    kpis,
    newDamage,
    unresolved: unresolvedRows,
    byDriver,
    byVehicle,
    repairTrend,
    timeline,
    photos: db.damagePhotos,
    reviews: db.damageReviews,
    repairs: db.maintenanceRepairs.map((row) => ({
      ...row,
      vanId: vanId(db, row.vehicle_id),
      stationCode: stationCode(db, row.station_id),
    })),
    grounding,
    reportRows,
    pairs,
    totals: {
      newThisWeek: newThisWeek.length,
      unresolved: unresolved.length,
      openCost,
      photoCount: db.damagePhotos.length,
      grounded: grounding.length,
      openInvestigations: reportRows.filter((row) => row.investigation_status === "open" || row.investigation_status === "pending_driver").length,
    },
    asOf: TODAY,
  };
}

export const WORKFLOW_NEXT: Record<SeedDatabase["damageEvents"][number]["workflow_status"], SeedDatabase["damageEvents"][number]["workflow_status"] | null> = {
  new: "under_review",
  under_review: "approved",
  approved: "scheduled_repair",
  scheduled_repair: "repaired",
  repaired: null,
};

export const WORKFLOW_LABEL: Record<SeedDatabase["damageEvents"][number]["workflow_status"], string> = {
  new: "New",
  under_review: "Under review",
  approved: "Approved",
  scheduled_repair: "Scheduled repair",
  repaired: "Repaired",
};

export const INVESTIGATION_LABEL: Record<SeedDatabase["damageEvents"][number]["investigation_status"], string> = {
  open: "Open investigation",
  pending_driver: "Pending driver",
  charged: "Charged",
  cleared: "Cleared",
  closed: "Closed",
};

export const SEVERITY_SCORE_LABEL: Record<SeedDatabase["damageEvents"][number]["severity_score"], string> = {
  minor: "Minor",
  moderate: "Moderate",
  severe: "Severe",
  ground_vehicle: "Ground vehicle",
};

export function formatDamageCost(value: number): string {
  return formatUsd(value);
}

export function formatDamageCount(value: number): string {
  return formatNumber(value, 0);
}
