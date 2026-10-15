import { formatZonedDateTime, zonedInstant } from "@/lib/format";

/** How long a requested pull stays "in progress" before we say sign-in may be needed. */
export const FRESH_WAIT_MS = 30 * 60 * 1000;

export type RefreshPhase = "idle" | "pulling" | "updated" | "waiting" | "current";

export function refreshStorageKey(page: string) {
  return `cjmk-ops-refresh:${page}`;
}

export type RefreshRequest = {
  requestedAt: string;
  /** True only when that request reached the webhook (HTTP 200 or a later 429 for it). */
  accepted: boolean;
};

/**
 * Read the last pull stored for a page.
 * A bare ISO timestamp is the previous client, which only saved a time after the webhook accepted.
 */
export function parseRefreshRequest(raw: string | null | undefined): RefreshRequest | null {
  const text = raw?.trim();
  if (!text) return null;
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as { requestedAt?: unknown; accepted?: unknown };
      if (typeof parsed.requestedAt === "string" && Number.isFinite(Date.parse(parsed.requestedAt))) {
        return { requestedAt: parsed.requestedAt, accepted: parsed.accepted === true };
      }
    } catch {
      return null;
    }
    return null;
  }
  if (!Number.isFinite(Date.parse(text))) return null;
  return { requestedAt: text, accepted: true };
}

export function refreshPhase(input: {
  requestedAt: string | null | undefined;
  seedAsOf: string | null | undefined;
  now: number;
  /** The newest seed did not move, and the webhook accepted the pull. */
  accepted?: boolean;
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
    if (input.accepted) {
      return {
        phase: "current",
        message: `Checked ${formatZonedDateTime(requestedAt)}, already up to date`,
      };
    }
    return { phase: "waiting", message: "Still waiting. Sign-in may be needed." };
  }

  return { phase: "pulling", message: "Pulling fresh data… usually 5–15 min" };
}
