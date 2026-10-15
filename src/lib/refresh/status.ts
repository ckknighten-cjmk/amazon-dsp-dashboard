import { formatZonedDateTime, zonedInstant } from "@/lib/format";

/** How long a requested pull stays "in progress" before we say sign-in may be needed. */
export const FRESH_WAIT_MS = 30 * 60 * 1000;

export type RefreshPhase = "idle" | "pulling" | "updated" | "waiting";

export function refreshStorageKey(page: string) {
  return `cjmk-ops-refresh:${page}`;
}

export function refreshPhase(input: {
  requestedAt: string | null | undefined;
  seedAsOf: string | null | undefined;
  now: number;
}): { phase: RefreshPhase; message: string | null } {
  const requestedAt = input.requestedAt?.trim();
  if (!requestedAt) return { phase: "idle", message: null };
  const requested = Date.parse(requestedAt);
  if (!Number.isFinite(requested)) return { phase: "idle", message: null };

  const seedAt = zonedInstant(input.seedAsOf);
  if (seedAt != null && seedAt > requested) {
    return {
      phase: "updated",
      message: `Updated ${formatZonedDateTime(input.seedAsOf!.trim())}`,
    };
  }

  if (input.now - requested >= FRESH_WAIT_MS) {
    return { phase: "waiting", message: "Still waiting. Sign-in may be needed." };
  }

  return { phase: "pulling", message: "Pulling fresh data… usually 5–15 min" };
}
