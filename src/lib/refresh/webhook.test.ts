import assert from "node:assert/strict";
import test from "node:test";
import { refreshPageKey } from "./pages";
import { FRESH_WAIT_MS, refreshPhase } from "./status";
import { RATE_LIMIT_MS, requestFreshData, resetRefreshRateLimit } from "./webhook";
import { POST } from "@/app/api/refresh/route";

const ENV = { url: "https://hooks.example/refresh", key: "secret-key" };

test("missing webhook env returns 503 and does not call the webhook", async () => {
  let called = false;
  const fetchImpl: typeof fetch = async () => {
    called = true;
    return new Response("ok");
  };

  const missingUrl = await requestFreshData(
    { page: "overview" },
    { env: { key: "secret-key" }, fetchImpl, store: new Map(), now: 0 }
  );
  const missingKey = await requestFreshData(
    { page: "overview" },
    { env: { url: ENV.url }, fetchImpl, store: new Map(), now: 0 }
  );

  assert.equal(missingUrl.status, 503);
  assert.equal(missingKey.status, 503);
  assert.deepEqual(missingUrl.body, { error: "webhook_not_configured" });
  assert.equal(called, false);
  assert.equal(JSON.stringify(missingUrl).includes("secret-key"), false);
  assert.equal(JSON.stringify(missingKey).includes("secret-key"), false);
});

test("the same page cannot fire again for 10 minutes", async () => {
  const store = new Map<string, number>();
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response("accepted", { status: 202 });
  };

  const first = await requestFreshData(
    { page: "fleet", week: 38 },
    { env: ENV, fetchImpl, store, now: 1_000 }
  );
  const blocked = await requestFreshData(
    { page: "fleet", date: "2026-09-23" },
    { env: ENV, fetchImpl, store, now: 1_000 + RATE_LIMIT_MS - 1 }
  );
  const otherPage = await requestFreshData(
    { page: "routes" },
    { env: ENV, fetchImpl, store, now: 1_000 }
  );
  const afterWindow = await requestFreshData(
    { page: "fleet" },
    { env: ENV, fetchImpl, store, now: 1_000 + RATE_LIMIT_MS }
  );

  assert.equal(first.status, 200);
  if (first.status === 200) assert.equal(first.body.requestedAt, new Date(1_000).toISOString());
  assert.equal(blocked.status, 429);
  if (blocked.status === 429) {
    assert.equal(blocked.body.lastRequestedAt, new Date(1_000).toISOString());
    assert.equal(JSON.stringify(blocked.body).includes("secret-key"), false);
  }
  assert.equal(otherPage.status, 200);
  assert.equal(afterWindow.status, 200);
  assert.equal(calls.length, 3);

  const header = new Headers(calls[0]?.init.headers);
  assert.equal(header.get("Authorization"), "Bearer secret-key");
  assert.equal(calls[0]?.url, ENV.url);
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), { page: "fleet", week: "38" });
});

test("REFRESH_WEBHOOK_KEY_HEADER overrides the header name and sends the raw key", async () => {
  let seen: Headers | undefined;
  const fetchImpl: typeof fetch = async (_url, init) => {
    seen = new Headers(init?.headers);
    return new Response(null, { status: 204 });
  };
  const result = await requestFreshData(
    { page: "payments" },
    {
      env: { ...ENV, keyHeader: "X-Refresh-Key" },
      fetchImpl,
      store: new Map(),
      now: 5_000,
    }
  );
  assert.equal(result.status, 200);
  assert.equal(seen?.get("X-Refresh-Key"), "secret-key");
  assert.equal(seen?.get("Authorization"), null);
});

test("POST /api/refresh falls back when env is missing and rate limits a page", async () => {
  resetRefreshRateLimit();
  const previous = {
    url: process.env.REFRESH_WEBHOOK_URL,
    key: process.env.REFRESH_WEBHOOK_KEY,
    header: process.env.REFRESH_WEBHOOK_KEY_HEADER,
  };
  const originalFetch = globalThis.fetch;
  delete process.env.REFRESH_WEBHOOK_URL;
  delete process.env.REFRESH_WEBHOOK_KEY;
  delete process.env.REFRESH_WEBHOOK_KEY_HEADER;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response("ok", { status: 200 });
  };
  try {
    const missing = await postPage("overview");
    assert.equal(missing.status, 503);
    assert.deepEqual(await missing.json(), { error: "webhook_not_configured" });
    assert.equal(calls, 0);

    process.env.REFRESH_WEBHOOK_URL = "https://hooks.example/refresh";
    process.env.REFRESH_WEBHOOK_KEY = "route-secret";
    const first = await postPage("scorecard");
    const second = await postPage("scorecard");
    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    const body = (await second.json()) as { lastRequestedAt?: string; error?: string };
    assert.equal(body.error, "rate_limited");
    assert.equal(typeof body.lastRequestedAt, "string");
    assert.equal(JSON.stringify(body).includes("route-secret"), false);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv(previous);
    resetRefreshRateLimit();
  }
});

test("page keys and pull status", () => {
  assert.equal(refreshPageKey("/"), "overview");
  assert.equal(refreshPageKey("/settings"), "overview");
  assert.equal(refreshPageKey("/routes/rt-cx19"), "routes");
  assert.equal(refreshPageKey("/drivers"), "drivers");
  assert.equal(refreshPageKey("/fleet"), "fleet");
  assert.equal(refreshPageKey("/scorecard"), "scorecard");
  assert.equal(refreshPageKey("/payments"), "payments");
  assert.equal(refreshPageKey("/compliance"), "compliance");
  assert.equal(refreshPageKey("/bonus"), "bonus");
  assert.equal(refreshPageKey("/incidents"), "incidents");

  const requestedAt = "2026-10-14T12:00:00.000Z";
  const requested = Date.parse(requestedAt);
  assert.deepEqual(
    refreshPhase({ requestedAt, seedAsOf: "2026-09-28T20:09:00-05:00", now: requested + 60_000 }),
    { phase: "pulling", message: "Pulling fresh data… usually 5–15 min" }
  );
  assert.equal(
    refreshPhase({
      requestedAt,
      seedAsOf: "2026-09-28T20:09:00-05:00",
      now: requested + FRESH_WAIT_MS,
    }).phase,
    "waiting"
  );
  const updated = refreshPhase({
    requestedAt: "2026-09-01T00:00:00.000Z",
    seedAsOf: "2026-09-28T20:09:00-05:00",
    now: Date.parse("2026-10-14T12:00:00.000Z"),
  });
  assert.equal(updated.phase, "updated");
  assert.equal(updated.message, "Updated Sep 28, 2026, 8:09 PM CDT");
});

function postPage(page: string) {
  return POST(
    new Request("http://localhost/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page }),
    })
  );
}

function restoreEnv(previous: { url?: string; key?: string; header?: string }) {
  if (previous.url == null) delete process.env.REFRESH_WEBHOOK_URL;
  else process.env.REFRESH_WEBHOOK_URL = previous.url;
  if (previous.key == null) delete process.env.REFRESH_WEBHOOK_KEY;
  else process.env.REFRESH_WEBHOOK_KEY = previous.key;
  if (previous.header == null) delete process.env.REFRESH_WEBHOOK_KEY_HEADER;
  else process.env.REFRESH_WEBHOOK_KEY_HEADER = previous.header;
}
