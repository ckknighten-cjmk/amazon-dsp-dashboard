"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DateRangeProvider } from "@/components/layout/date-range-context";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <DateRangeProvider>
      <div className="flex min-h-full">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 md:block">
          <Sidebar />
        </aside>

        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="w-60 p-0 sm:max-w-60">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenNav={() => setNavOpen(true)} />
          <main className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
        </div>
      </div>
    </DateRangeProvider>
  );
}
