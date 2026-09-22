# Amazon DSP Dashboard

This repository is the single source of truth for CJMK DSP operations software.

**Canonical repo:** https://github.com/ckknighten-cjmk/amazon-dsp-dashboard

| Path | App | Stack |
| --- | --- | --- |
| Repository root | **CJMK Ops** — daily HQ for CJMK Inc. / DNA4 Memphis | Next.js App Router |
| [`apps/morning-dispatch`](apps/morning-dispatch) | Earlier Vite command center, including the Morning Dispatch Readiness Center | Vite + React |

Live CJMK Ops seeds come from Amazon DSP Console: the **Week 37** scorecard (Sep 6–12, 2026) and the **2026-09-21** Delivery Execution board. Fleet and incidents in CJMK Ops are still mock fixtures. Do not invent metrics that Console did not publish.

## CJMK Ops (repository root)

Operations HQ for **CJMK Inc.**, an SDVOSB Amazon DSP running last-mile out of station **DNA4 (Memphis, TN)**. Station managers and owners can open it daily to see performance, routes, drivers, fleet, incidents, and Amazon-style scorecard health.

This is a demo app. It does not call Amazon APIs and does not require credentials.

### Run

```bash
npm install
npm run build
npm run dev
```

`npm ci` uses the lockfile and is what CI should run. Then open [http://127.0.0.1:43123](http://127.0.0.1:43123).

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js App Router dev server on port **43123** |
| `npm run build` | Production build |
| `npm start` | Serve the production build on 43123 |

No auth in v1. Dark theme is the default; toggle light/dark from the top bar or Settings.

### Seeded data

| Surface | Source |
| --- | --- |
| **Routes / Delivery Execution** | Amazon DSP Console Delivery Execution board for **2026-09-21** (37 routes, associates, stops, packages, notes, board totals) plus the exception Packages CSV (178 rows). Board package-status chips use Console totals (e.g. reattemptable **17**); the exceptions table uses export rows (19 reattemptable). Vehicle and on-time % were **not** on the Console board — the UI leaves them unavailable and does not invent them. |
| **Scorecard** | DSP Console Performance Summary for **Week 37 (Sep 6–12, 2026)** — overall standing **85.8 Fantastic**. No prior-week comparison was published, so the UI does not invent deltas. |
| **Drivers** | Associate names from the Sep 21 Console routes (including multi-transporter crews). Tenure, phone, and scorecard contribution were not on the board. |
| **Fleet / incidents** | Still **mock** fixtures. Console did not show vehicle IDs, so the yard roster is not linked to live routes. |

Station clock is frozen at **Mon Sep 21, 2026 · 8:42 p.m. CT** (the Console capture time).

### Pages

- **Overview** — KPIs from the Sep 21 Delivery Execution board (99% package gauge, remaining / reattemptable / undeliverable, in-progress routes). No prior-day deltas.
- **Scorecard** — DSP Console Week 37: overall 85.8 Fantastic, plus Safety, Quality, and Service Reliability metrics
- **Routes** — Delivery Execution board: 37 live routes, 99% gauges, package-status chips, work-hour risk, on-road pickups, and the exception-package export
- **Drivers** — Associates named on those routes (all names on split / multi-transporter routes)
- **Fleet** — Mock EDV / rental cargo / step van yard status
- **Incidents** — Mock DVR, complaint, vehicle, and safety log
- **Settings** — Company display name, timezone (`America/Chicago` default), theme

The sticky top bar **Today / This week** control drives Overview KPIs. The week toggle still only has Sep 21 in this Console pull.

### Swap mock / seed data for live sources later

Keep the TypeScript models in [`src/lib/types.ts`](src/lib/types.ts). Pages import only from [`src/lib/data/index.ts`](src/lib/data/index.ts).

1. Implement the `DataSource` interface in `src/lib/data/index.ts` (CSV, spreadsheet export, or your own API).
2. Point `export const source` at that implementation instead of `mockDataSource`.
3. Leave seed files under `src/lib/data/seed/` as fixtures for local demo.

Console snapshots used here live at:

- [`src/lib/data/seed/delivery-execution-2026-09-21.json`](src/lib/data/seed/delivery-execution-2026-09-21.json)
- [`src/lib/data/seed/packages-exceptions-2026-09-21.csv`](src/lib/data/seed/packages-exceptions-2026-09-21.csv)

Do **not** put Amazon credentials in this repo. Do not scrape Seller Central / DSP consoles from the app.

### Scorecard

The Scorecard page encodes **live DSP Console Performance Summary values** for CJMK Inc. / DNA4, Week 37 (Sep 6–12, 2026). Overall standing **85.8 Fantastic**. No prior-week comparison was published in that summary, so the UI does not invent deltas.

Fantastic / Great / Fair / Poor **numeric bands** on each tile are still **illustrative**. **Badges** match the standing Amazon displayed (including CDF DPMO **Great**, compliance **Compliant**, and No Data metrics).

### Stack

Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui, lucide-react, Recharts.

## Morning Dispatch (`apps/morning-dispatch`)

The Vite + React operations command center that already lived on `main` — Morning Dispatch Readiness Center, live operations, fleet readiness, scorecard intelligence, workforce, and the rest — is preserved under [`apps/morning-dispatch`](apps/morning-dispatch). Its `package.json`, `src/`, `public/`, and configs are unchanged aside from the move. Its own notes are in [`apps/morning-dispatch/README.md`](apps/morning-dispatch/README.md).

### Run

```bash
cd apps/morning-dispatch
npm install
npm run build
npm run dev
```

`npm ci` works the same way from that directory. Open http://localhost:5173 and sign in with a demo role. Password for every demo account is `demo`.
