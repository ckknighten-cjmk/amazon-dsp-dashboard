import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { currentStation } from "@/lib/station-request";
import { stationProfile } from "@/lib/stations";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const station = await currentStation();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${geistSans.className} flex min-h-full flex-col`}>
        <ThemeProvider>
          <TooltipProvider>
            <AppShell initialStation={station}>{children}</AppShell>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
