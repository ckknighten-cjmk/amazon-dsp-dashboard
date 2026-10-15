import { station as dna4Station } from "@/lib/data/drivers";
import { stationProfile, type StationCode } from "@/lib/stations";
import type { StationSettings } from "@/lib/types";

/** DNA4 returns the existing seed profile object. Other stations use the catalog. */
export function stationSettings(code: StationCode): StationSettings {
  if (code === "DNA4") return dna4Station;
  const profile = stationProfile(code);
  return {
    companyName: dna4Station.companyName,
    legalName: dna4Station.legalName,
    ownership: dna4Station.ownership,
    stationCode: profile.code,
    stationName: profile.displayName,
    city: profile.region,
    timezone: dna4Station.timezone,
    generalManager: "",
  };
}
