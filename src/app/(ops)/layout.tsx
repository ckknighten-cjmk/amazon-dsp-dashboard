import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { currentStation } from "@/lib/station-request";
import { stationProfile } from "@/lib/stations";

export async function generateMetadata(): Promise<Metadata> {
  const code = await currentStation();
  const profile = stationProfile(code);
  return {
    title: {
      default: `CJMK Ops · ${profile.code}`,
      template: `%s · CJMK Ops · ${profile.code}`,
    },
    description: `Last-mile operations HQ for CJMK Inc., an SDVOSB Amazon DSP at station ${profile.code} (${profile.region}).`,
  };
}

/** Dashboard chrome stays on operations routes. Public SMS policy pages are outside this group. */
export default async function OpsLayout({ children }: { children: ReactNode }) {
  const station = await currentStation();
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AppShell initialStation={station}>{children}</AppShell>
      </TooltipProvider>
    </ThemeProvider>
  );
}
