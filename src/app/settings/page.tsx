"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStation } from "@/components/layout/station-context";
import { StationEmptyPage } from "@/components/station-empty";
import { getDeliveryBoard, getStation } from "@/lib/data";
import { hasStationDataset } from "@/lib/data/station-seeds";
import { formatClock, OPS_TIMEZONE, seedCapturedLabel } from "@/lib/format";

const STORAGE_KEY = "cjmk-ops-settings";
const LEGACY_STORAGE_KEY = "valiant-ops-settings";

const TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
];

type LocalSettings = {
  companyName: string;
  stationName: string;
  timezone: string;
};

export default function SettingsPage() {
  const { code } = useStation();
  const ready = hasStationDataset(code, "settings");
  const seed = getStation();
  const overviewSeed = getDeliveryBoard().capturedAt;
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<LocalSettings>({
    companyName: seed.companyName,
    stationName: `${seed.stationCode} · ${seed.stationName}`,
    timezone: seed.timezone || OPS_TIMEZONE,
  });

  useEffect(() => {
    if (!ready) return;
    setMounted(true);
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<LocalSettings>;
      const staleBrand =
        typeof parsed.companyName === "string" &&
        /valiant/i.test(parsed.companyName);
      setForm({
        companyName: staleBrand ? seed.companyName : parsed.companyName ?? seed.companyName,
        stationName: staleBrand
          ? `${seed.stationCode} · ${seed.stationName}`
          : parsed.stationName ?? `${seed.stationCode} · ${seed.stationName}`,
        timezone: parsed.timezone || seed.timezone || OPS_TIMEZONE,
      });
      if (staleBrand || localStorage.getItem(LEGACY_STORAGE_KEY)) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            companyName: staleBrand ? seed.companyName : parsed.companyName ?? seed.companyName,
            stationName: staleBrand
              ? `${seed.stationCode} · ${seed.stationName}`
              : parsed.stationName ?? `${seed.stationCode} · ${seed.stationName}`,
            timezone: parsed.timezone || seed.timezone || OPS_TIMEZONE,
          })
        );
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [ready, seed.companyName, seed.stationCode, seed.stationName, seed.timezone]);

  if (!ready) {
    return <StationEmptyPage title="Station settings" station={code} />;
  }

  const isDark = (resolvedTheme ?? theme) === "dark";

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <PageHeader
        title="Station settings"
        description="Display name and timezone for this ops HQ. v1 is local-only and does not call Amazon APIs. Refresh asks for a fresh overview seed."
        updatedLabel={seedCapturedLabel(overviewSeed)}
        seedAsOf={overviewSeed}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company & station</CardTitle>
            <CardDescription>
              Profile for CJMK Inc., an SDVOSB Amazon DSP at DNA4 Memphis. Stored in this browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="company">Company display name</Label>
              <Input
                id="company"
                value={form.companyName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, companyName: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="station">Station</Label>
              <Input
                id="station"
                value={form.stationName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stationName: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tz">Timezone</Label>
              <select
                id="tz"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Default {OPS_TIMEZONE}. Mock clock is frozen at {formatClock()} CT.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Legal name {seed.legalName} · {seed.ownership} · GM {seed.generalManager}
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={save}>Save locally</Button>
              {saved ? (
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  Saved in this browser
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Dark-friendly ops theme with an amber accent.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Dark mode</p>
                <p className="text-xs text-muted-foreground">
                  Also available from the top bar.
                </p>
              </div>
              {mounted ? (
                <Switch
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  aria-label="Toggle dark mode"
                />
              ) : (
                <div className="h-[18px] w-8 rounded-full bg-muted" />
              )}
            </div>
            <div className="rounded-lg border border-dashed px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              Scorecard values are from DSP Console Performance Summary. The
              scorecard week menu lists every captured week, newest first. Week
              41 (Oct 4–10, 2026), overall 82.7 Fantastic, is the default.
              Week 42 of 2026 is not published. Week 38 (Sep 13–19, 2026) is
              overall 84 Fantastic, and Week 37 (Sep 6–12, 2026) is overall
              85.8 Fantastic. Fantastic / Great / Fair / Poor bands on tiles are
              illustrative; badges match Amazon’s displayed standing. Routes are
              the Oct 22 Delivery Execution board. The associate roster unions
              Amazon schedule Weeks 38 and 39, merges that board by name, and
              labels ADP-only names that have no transporter ID. Phone and email
              come from the ADP Employee Census when the name matches. Fleet is
              the DNA4 My vehicles capture. Incidents remain mock.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
