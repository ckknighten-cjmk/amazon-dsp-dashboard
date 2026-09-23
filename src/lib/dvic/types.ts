/** Daily Vehicle Inspection Checklist rows. Damage is only what a capture lists. */

export type DvicPhase = "pre_trip" | "post_trip" | "avi_post_trip";

export interface DvicDamage {
  area: string;
  detail: string;
}

export interface DvicInspection {
  id: string;
  vehicleUnit: string;
  serviceDate: string;
  phase: DvicPhase;
  damage: DvicDamage[];
}

export interface DvicTotals {
  preTrip: number;
  postTrip: number;
  aviPostTrip: number;
}

export interface DvicCapture {
  source: string;
  nav: string;
  stationCode: string;
  company: string;
  serviceDate: string;
  totals: DvicTotals;
  inspections: DvicInspection[];
  disclaimer: string;
}

export interface NewDamageAlert {
  id: string;
  vehicleUnit: string;
  serviceDate: string;
  phase: Exclude<DvicPhase, "pre_trip">;
  area: string;
  detail: string;
  reason: string;
}

/** One vehicle on one service day, with the damage each phase actually listed. */
export interface DvicDayPair {
  id: string;
  vehicleUnit: string;
  serviceDate: string;
  hadPreTrip: boolean;
  hadPostTrip: boolean;
  hadAviPostTrip: boolean;
  preTrip: DvicDamage[];
  postTrip: DvicDamage[];
  aviPostTrip: DvicDamage[];
  newDamage: NewDamageAlert[];
}
