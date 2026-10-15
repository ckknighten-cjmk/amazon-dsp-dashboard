"use client";

import { useStation } from "@/components/layout/station-context";
import { parseStationParam, STATIONS } from "@/lib/stations";

export function StationSwitcher() {
  const { code, selectStation } = useStation();

  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Station</span>
      <select
        aria-label="Station"
        data-station-switcher
        value={code}
        onChange={(event) => {
          const next = parseStationParam(event.target.value);
          if (next) selectStation(next);
        }}
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm font-medium dark:bg-input/30"
      >
        {STATIONS.map((station) => (
          <option key={station.code} value={station.code}>
            {station.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
