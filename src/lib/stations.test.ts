import assert from "node:assert/strict";
import test from "node:test";
import { getRoutes, getScorecard } from "./data";
import { station as dna4Station } from "./data/drivers";
import { hasStationDataset, loadStationDataset } from "./data/station-seeds";
import { stationSettings } from "./station-settings";
import { hrefWithPeriod } from "./period";
import {
  DEFAULT_STATION_CODE,
  hrefWithStation,
  NO_CAPTURE_LABEL,
  parseStationParam,
  readStationCookieValue,
  resolveStation,
  STATIONS,
  stationCookieHeader,
  stationEmptyTitle,
  stationProfile,
} from "./stations";

test("the station catalog is the single list and DNA4 is the default", () => {
  assert.deepEqual(
    STATIONS.map((station) => station.code),
    ["DNA4", "WTN2"],
  );
  assert.equal(DEFAULT_STATION_CODE, "DNA4");
  for (const station of STATIONS) {
    assert.ok(station.displayName);
    assert.ok(station.region);
    assert.equal(stationProfile(station.code).code, station.code);
  }
  assert.equal(stationProfile("DNA4").region, "Memphis");
  assert.equal(stationProfile("WTN2").displayName, "WTN2");
});

test("station choice resolves from the URL, then the cookie, then localStorage", () => {
  assert.equal(parseStationParam("WTN2"), "WTN2");
  assert.equal(parseStationParam(" dna4 "), "DNA4");
  assert.equal(parseStationParam("wtn2"), "WTN2");
  assert.equal(parseStationParam("NOPE"), null);
  assert.equal(parseStationParam(""), null);
  assert.equal(parseStationParam(null), null);

  assert.equal(resolveStation({ query: "WTN2", cookie: "DNA4", storage: "DNA4" }), "WTN2");
  assert.equal(resolveStation({ query: "nope", cookie: "WTN2", storage: "DNA4" }), "WTN2");
  assert.equal(resolveStation({ query: null, cookie: null, storage: "WTN2" }), "WTN2");
  assert.equal(resolveStation({}), "DNA4");

  const cookie = stationCookieHeader("WTN2");
  assert.match(cookie, /^cjmk-ops-station=WTN2;/);
  assert.equal(readStationCookieValue(`theme=dark; ${cookie}`), "WTN2");
  assert.equal(readStationCookieValue("cjmk-ops-station=NOPE"), null);
});

test("scorecard week links keep the selected station", () => {
  const href = hrefWithStation(hrefWithPeriod("/scorecard?week=37", { kind: "today" }), "WTN2");
  const params = new URL(href, "http://localhost").searchParams;
  assert.equal(params.get("week"), "37");
  assert.equal(params.get("period"), "today");
  assert.equal(params.get("station"), "WTN2");
  assert.equal(hrefWithStation("/drivers", "DNA4"), "/drivers?station=DNA4");
});

test("WTN2 has no seed and DNA4 values stay on DNA4", () => {
  assert.equal(hasStationDataset("WTN2", "overview"), false);
  assert.equal(hasStationDataset("WTN2", "drivers"), false);
  assert.equal(hasStationDataset("WTN2", "payments"), false);
  assert.equal(hasStationDataset("WTN2", "fleet"), false);
  assert.equal(hasStationDataset("DNA4", "overview"), true);
  assert.equal(loadStationDataset("WTN2", "routes", () => getRoutes()), null);
  assert.equal(loadStationDataset("WTN2", "scorecard", () => getScorecard(38), { week: 38 }), null);

  const routes = loadStationDataset("DNA4", "routes", () => getRoutes());
  assert.ok(routes);
  assert.equal(routes.length, 39);
  assert.equal(getScorecard(38).overallScore, 84);
  assert.equal(stationSettings("DNA4"), dna4Station);
  assert.equal(dna4Station.stationCode, "DNA4");
  assert.equal(dna4Station.city, "Memphis, TN");
  assert.equal(stationEmptyTitle("WTN2"), "No data for WTN2 yet");
  assert.equal(NO_CAPTURE_LABEL, "No capture yet");
  assert.equal(stationSettings("WTN2").stationCode, "WTN2");
  assert.equal(stationSettings("WTN2").city, "West Tennessee");
});
