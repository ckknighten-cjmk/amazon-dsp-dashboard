"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

/**
 * CJMK Ops pages read static seed modules. Refresh asks the App Router to
 * re-render the current route (`router.refresh`) and re-reads those getters.
 * It does not call Amazon or ADP. New Console numbers show up only after the
 * seed modules themselves change.
 */
const MIN_BUSY_MS = 600;
const MAX_BUSY_MS = 8000;

type RefreshContextValue = {
  refresh: () => void;
  busy: boolean;
  announcement: string;
};

const RefreshContext = createContext<RefreshContextValue | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const busyRef = useRef(false);
  const startedAt = useRef(0);

  const release = useCallback(() => {
    busyRef.current = false;
    setBusy(false);
    setAnnouncement("Seed data reloaded");
  }, []);

  const refresh = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    startedAt.current = Date.now();
    setBusy(true);
    setAnnouncement("Updating data");
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    if (!busy || isPending) return;
    const elapsed = Date.now() - startedAt.current;
    const wait = Math.max(0, MIN_BUSY_MS - elapsed);
    const timer = window.setTimeout(release, wait);
    return () => window.clearTimeout(timer);
  }, [busy, isPending, release]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(release, MAX_BUSY_MS);
    return () => window.clearTimeout(timer);
  }, [busy, release]);

  const value = useMemo(
    () => ({ refresh, busy, announcement }),
    [refresh, busy, announcement]
  );

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export function RefreshDataButton() {
  const ctx = useContext(RefreshContext);

  if (!ctx) return null;

  const label = ctx.busy ? "Updating data" : "Refresh data";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={ctx.refresh}
        disabled={ctx.busy}
        aria-busy={ctx.busy}
        aria-label={label}
        data-refresh="seed"
        data-state={ctx.busy ? "refreshing" : "idle"}
      >
        <RefreshCw
          aria-hidden
          className={ctx.busy ? "motion-safe:animate-spin" : undefined}
        />
        {ctx.busy ? "Updating…" : "Refresh"}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {ctx.announcement}
      </span>
    </>
  );
}
