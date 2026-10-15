"use client";

import { RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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
import { refreshPageKey } from "@/lib/refresh/pages";
import {
  FRESH_WAIT_MS,
  parseRefreshRequest,
  refreshPhase,
  refreshStorageKey,
  type RefreshRequest,
} from "@/lib/refresh/status";

/**
 * Refresh posts to /api/refresh so an external webhook can pull fresh seeds.
 * The webhook key stays on the server. This component also asks the App Router
 * to re-read the seeds already in the bundle (`router.refresh`). If the webhook
 * is not configured, the API returns 503 and only that re-read runs.
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

export function RefreshDataButton({
  seedAsOf,
  week,
  date,
}: {
  /** Zoned seed instant. A newer value than the stored request clears the pull. */
  seedAsOf?: string | null;
  week?: string | number | null;
  date?: string | null;
}) {
  const ctx = useContext(RefreshContext);
  const pathname = usePathname();
  const page = refreshPageKey(pathname);
  const [request, setRequest] = useState<RefreshRequest | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const posting = useRef(false);

  useEffect(() => {
    try {
      setRequest(parseRefreshRequest(window.localStorage.getItem(refreshStorageKey(page))));
    } catch {
      setRequest(null);
    }
  }, [page]);

  const phase = refreshPhase({
    requestedAt: request?.requestedAt,
    seedAsOf,
    now,
    accepted: request?.accepted,
  });

  useEffect(() => {
    if (phase.phase !== "pulling" || !request?.requestedAt) return;
    const requested = Date.parse(request.requestedAt);
    if (!Number.isFinite(requested)) return;
    const wait = Math.max(0, requested + FRESH_WAIT_MS - Date.now());
    const timer = window.setTimeout(() => setNow(Date.now()), wait + 25);
    return () => window.clearTimeout(timer);
  }, [phase.phase, request]);

  const remember = useCallback(
    (value: string, accepted: boolean) => {
      const next = { requestedAt: value, accepted };
      setRequest(next);
      setNow(Date.now());
      try {
        window.localStorage.setItem(refreshStorageKey(page), JSON.stringify(next));
      } catch {
        /* private mode */
      }
    },
    [page]
  );

  const requestFresh = useCallback(() => {
    if (!ctx || posting.current || ctx.busy) return;
    posting.current = true;
    ctx.refresh();

    const payload: { page: string; week?: string; date?: string } = { page };
    if (week != null && String(week).trim()) payload.week = String(week).trim();
    if (date != null && date.trim()) payload.date = date.trim();

    void fetch("/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (response.status === 503) return;
        const body = (await response.json().catch(() => null)) as {
          requestedAt?: unknown;
          lastRequestedAt?: unknown;
        } | null;
        if (response.status === 429 && typeof body?.lastRequestedAt === "string") {
          remember(body.lastRequestedAt, true);
          return;
        }
        if (response.ok && typeof body?.requestedAt === "string") {
          remember(body.requestedAt, true);
          return;
        }
        if (response.status !== 503) {
          remember(new Date().toISOString(), false);
        }
      })
      .catch(() => {
        remember(new Date().toISOString(), false);
      })
      .finally(() => {
        posting.current = false;
      });
  }, [ctx, date, page, remember, week]);

  if (!ctx) return null;

  const label = ctx.busy ? "Updating data" : "Refresh data";
  const live = phase.message ?? ctx.announcement;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={requestFresh}
        disabled={ctx.busy}
        aria-busy={ctx.busy}
        aria-label={label}
        data-refresh="seed"
        data-refresh-page={page}
        data-refresh-phase={phase.phase}
        data-state={ctx.busy ? "refreshing" : "idle"}
      >
        <RefreshCw
          aria-hidden
          className={ctx.busy ? "motion-safe:animate-spin" : undefined}
        />
        {ctx.busy ? "Updating…" : "Refresh"}
      </Button>
      {phase.message ? (
        <p
          className="max-w-full text-xs text-muted-foreground"
          data-refresh-status={phase.phase}
        >
          {phase.message}
        </p>
      ) : null}
      <span className="sr-only" role="status" aria-live="polite">
        {live}
      </span>
    </>
  );
}
