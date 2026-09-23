# Amazon DSP Dashboard

This repository is the single source of truth for CJMK DSP operations software.

**Canonical repo:** https://github.com/ckknighten-cjmk/amazon-dsp-dashboard

| Path | App | Stack |
| --- | --- | --- |
| Repository root | **CJMK Ops** — daily HQ for CJMK Inc. / DNA4 Memphis | Next.js App Router |
| [`apps/morning-dispatch`](apps/morning-dispatch) | Earlier Vite command center, including the Morning Dispatch Readiness Center | Vite + React |

Live CJMK Ops seeds come from Amazon DSP Console: the **Week 38** scorecard (Sep 13–19, 2026, with Week 37 still on the scorecard switcher), the **2026-09-21** Delivery Execution board, the **Week 38** 10-hour bonus list, and the **Week 38** and **Week 39** schedule workbooks used by Compliance. Fleet and incidents in CJMK Ops are still mock fixtures. Do not invent metrics that Console did not publish.

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
| **Routes / Delivery Execution** | Amazon DSP Console Delivery Execution **end-of-day** board for **2026-09-21** (37 routes, 0 in progress, associates, stops, packages, sign-out notes, board totals) plus the exception Packages CSV (179 rows). Board package-status chips use Console totals (reattemptable **1**, undeliverable **1**, missing **9**, RTS **105**, pickup failed **63**). Those chips match the CSV on this capture. Vehicle and on-time % were **not** on the Console board — the UI leaves them unavailable and does not invent them. A route is marked **Rescue: Yes** when it lists more than one associate (12 multi-transporter routes). The first associate is primary and the rest are rescuers. This capture has no `rescueActions` list, so that column is not Amazon’s official rescue flag. |
| **Scorecard** | DSP Console Performance Summary. **Week 38 (Sep 13–19, 2026)** is the default — overall standing **84 Fantastic**. **Week 37 (Sep 6–12, 2026)** stays on the week switcher at **85.8 Fantastic**. No prior-week comparison was published, so the UI does not invent deltas. |
| **Payments** | Amazon DSP Console Flex Payments scrape captured **2026-09-21** for CJMK Inc. / DNA4. Pending action **$192,202.66** (6 invoices), visible paid total, invoice list, Week 37 variable **$88,556.70** and incentive **$3,878.88**, and YTD Insights labeled **2025** as Console displayed them. No deposit or payment-method details were in that scrape. The Week 37 variable section rollup matches the **Sep 23** variable invoice (`INV-GA6T0P-0000000614`). Week 38 Work Summary is seeded (7,865 packages, 7,860 delivered, 5 pickups, 34 routes, 2,410 miles, 0 unplanned delays). The Week 38 variable invoice was **not listed** — no invoice total is invented. |
| **Compliance** | **Week 38 (Sep 13–19, 2026)** opens by default, and **Week 39 (Sep 20–26, 2026)** stays on the same page. Amazon side is the DSP Console weekly schedule workbook (Rostered Work Blocks + Shifts & Availability). Week 38 was exported **9/22/26, 8:59:54 PM**. Week 39 was exported **9/21/26, 11:40:31 PM**. Week 38 ADP is a read-only Workforce Now **Group Timecard** for the full Sun–Sat week; individual timecards were not captured, and Breaks is summary-only (no per-DA meal rows, and work-hour nearing counts were not in the capture). Week 39 ADP is **Sep 20 and Sep 21** only — the Sep 22 grid was blank, and the Timecard Detail Report export failed (**ORA-20005**). Individual timecard views for Zora Bobo, Brandon Clark, and Chance Stupp are included for Week 39. Compliance Breaks meal clocks were not in that capture; the page only joins the three associates named on the attached breaks screenshot. **Loading either week into ADP schedule templates is deferred** and the control on the page stays disabled. |
| **Drivers** | Full roster: union of Amazon schedule associates for **Weeks 38 and 39** (transporter ID). Sep 21 Delivery Execution supplies today’s routes, packages, and status when the name matches. ADP Group Timecard names with no schedule transporter ID are included and labeled **ADP only**. Phone and email come from the ADP Employee Census (526 employees, 126 with a phone) when the name matches. The page opens on **Active**, and also keeps associates the census did not list. Terminated and deceased are labeled and available on the employment filter. Tenure and scorecard contribution were not in these exports. |
| **Fleet / incidents** | Fleet is the DNA4 **My vehicles** capture in [`src/lib/data/seed/amazon-fleet-dna4.json`](src/lib/data/seed/amazon-fleet-dna4.json): **56** vehicles from **Administration → Fleet → My vehicles** (`unit`, `plate`, `makeModel`, `vin`, `ownership`, `type`, `status`, `statusReason`, `lastRouteCompleted`, `assignedRoute`). Year and mileage were null in that export and stay blank. Rivian EDV 700 rows that Console typed as “2dr Step Van” are shown as Amazon EDV. Eight rows have a blank unit; the plate is the published identifier. DVIC for **2026-09-23** is **0** pre-trip, **0** post-trip, **0** AVI post-trip, with no damage rows (`dvic-2026-09-23.json`, from **Administration → Fleet → Dashboard → Today's vehicle inspections**). Incidents remain mock. |

Station clock is frozen at **Mon Sep 21, 2026 · 10:12 p.m. CT** (the end-of-day Console capture time).

### Pages

- **Overview** — KPIs from the Sep 21 end-of-day Delivery Execution board (99% package gauge, remaining / reattemptable / undeliverable, 0 in-progress routes). Package delivered counts are the sum of Console route rows. No prior-day deltas.
- **Scorecard** — DSP Console Week 38 (default): overall 84 Fantastic, plus Safety, Quality, and Service Reliability metrics. Week 37 (85.8 Fantastic) stays on the week switcher. The top-bar period shows a week only when it overlaps that Console week. CSV export uses the values shown for the selected week. Prior week stays “Not shown in Console.”
- **10 Hour Bonus** — Week 38 delivery associates on routes with **180 or more completed stops**. **100** solo DAs have a clear route total. **115** multi-transporter rows stay flagged: the stop count is the route total, and Amazon did not say which DA completed those stops, so it is not split. CSV and Excel are associate-first (`date`, `deliveryAssociate`, `stopsCompleted`, then route). The table hides days outside the selected period.
- **Routes** — End-of-day Delivery Execution board: 37 routes, 99% gauges, package-status chips (RTS 105), work-hour risk, on-road pickups, the exception-package export, and a Rescue column for multi-associate routes. CSV downloads sit next to the routes and exceptions tables.
- **Drivers** — Full Weeks 38–39 schedule roster, plus ADP-only names, with Sep 21 route activity merged by name. Census phone and email attach on a unique name match. The page opens on Active. CSV export downloads the full roster, including blank phones.
- **Fleet** — 56 DNA4 vehicles from Console My vehicles. CSV export is `fleet-vehicles-dna4.csv`. Year and mileage stay blank. DVIC pairs pre-trip and post-trip for the same vehicle and service day and marks post-trip damage the pre-trip did not list. The Sep 23 dashboard capture is 0 / 0 / 0 with empty inspection lists, so that section stays empty. CSV export downloads those pairs.
- **Incidents** — Mock DVR, complaint, vehicle, and safety log
- **Payments** — Flex Payments settlements seeded **2026-09-21**: pending action, paid total, invoice table, Week 37 breakdowns, and 2025 YTD Insights. The invoice list follows the top-bar period. CSV export includes the full Console list. The reconcile compares the Week 37 variable invoice with the Work Summary Tool for Weeks 37–39. Weeks 38 and 39 have Work Summary captures and no variable invoice on the list. A Sep 13–19 period overlaps the Week 38 Work Summary; the Week 38 invoice panel stays “not yet listed.” Package units and route payments are not treated as the same counts as Work Summary packages and routes completed.
- **Compliance** — Week 38 (default) and Week 39 ADP vs Amazon timecard exceptions: missing punches, days over 12 hours, rolling 7-day totals over 60 hours (captured ADP days only), and meal-status disagreements when per-DA break rows exist. Unmatched Amazon and ADP names are listed separately. Each table can be exported, and “Export week” combines missing punches, over 12, over 60, and meal rows for the selected week. ADP schedule template load is **coming later** and is not implemented.
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
- [`src/lib/data/seed/payments-settlements-2026-09-21.json`](src/lib/data/seed/payments-settlements-2026-09-21.json) — Flex Payments seed date **2026-09-21**. Week 37 variable lines are the section totals from the Sep 23 variable invoice.
- [`src/lib/data/seed/variable-invoice-week37.json`](src/lib/data/seed/variable-invoice-week37.json) — Variable invoice `INV-GA6T0P-0000000614`, Week 37, Sep 6–12 2026, total **$88,556.70**
- [`src/lib/data/seed/variable-invoice-week37.pdf`](src/lib/data/seed/variable-invoice-week37.pdf) — PDF export captured with that invoice
- [`src/lib/data/seed/work-summary-week37.json`](src/lib/data/seed/work-summary-week37.json) — Work Summary Tool, Week 37 (5,335 packages, 31 routes completed)
- [`src/lib/data/seed/work-summary-week38.json`](src/lib/data/seed/work-summary-week38.json) — Work Summary Tool, Week 38 (7,865 packages, 34 routes completed). No variable invoice was listed.
- [`src/lib/data/seed/variable-invoice-week38.json`](src/lib/data/seed/variable-invoice-week38.json) — Week 38 variable invoice status **not_listed**. No dollars.
- [`src/lib/data/seed/10hr-bonus-week38.json`](src/lib/data/seed/10hr-bonus-week38.json) — 148 Week 38 routes with 180 or more completed stops.
- [`src/lib/data/seed/10hr-bonus-week38-by-da.json`](src/lib/data/seed/10hr-bonus-week38-by-da.json) — those routes as delivery-associate rows: 100 solo, 115 multi-transporter. Stops stay the route total.
- [`src/lib/data/seed/work-summary-week39.json`](src/lib/data/seed/work-summary-week39.json) — Work Summary Tool, Week 39, captured in progress with zero summary metrics. No variable invoice was listed.
- [`src/lib/data/seed/week38-amazon-schedule.xlsx`](src/lib/data/seed/week38-amazon-schedule.xlsx) — Amazon Scheduling Week 38 workbook (source for blocks and shifts)
- [`src/lib/data/seed/week38-amazon-schedule.json`](src/lib/data/seed/week38-amazon-schedule.json) — that workbook parsed with the real headers (Rostered Work Blocks and Shifts & Availability)
- [`src/lib/data/seed/adp-timecards-week38.json`](src/lib/data/seed/adp-timecards-week38.json) — ADP Group Timecard for Sep 13–19. `individualTimecards` is empty
- [`src/lib/data/seed/week38-amazon-breaks.json`](src/lib/data/seed/week38-amazon-breaks.json) — Week 38 Breaks dashboard totals only. No per-DA meal rows, and work-hour counts are null
- [`src/lib/data/seed/week39-amazon-schedule.xlsx`](src/lib/data/seed/week39-amazon-schedule.xlsx) — Amazon Scheduling Week 39 workbook (source for blocks and shifts)
- [`src/lib/data/seed/week39-amazon-schedule.json`](src/lib/data/seed/week39-amazon-schedule.json) — that workbook parsed with the real headers (Rostered Work Blocks and Shifts & Availability)
- [`src/lib/data/seed/adp-timecards-week39.json`](src/lib/data/seed/adp-timecards-week39.json) — ADP Group Timecard for Sep 20–21, plus three individual timecards
- [`src/lib/data/seed/week39-amazon-breaks.json`](src/lib/data/seed/week39-amazon-breaks.json) — Compliance Breaks rows visible in the Week 39 screenshot, and the dashboard totals. No meal start/end times.

Do **not** put Amazon credentials in this repo. Do not scrape Seller Central / DSP consoles from the app.

### Scorecard

The Scorecard page encodes **live DSP Console Performance Summary values** for CJMK Inc. / DNA4. **Week 38 (Sep 13–19, 2026)** is the default. Overall standing **84 Fantastic**. **Week 37 (Sep 6–12, 2026)** remains at **85.8 Fantastic**. No prior-week comparison was published in either summary, so the UI does not invent deltas.

Fantastic / Great / Fair / Poor **numeric bands** on each tile are still **illustrative**. **Badges** match the standing Amazon displayed. On Week 38 that includes Delivery Completion DPMO **Great** (4,166.9), CDF DPMO **Great** (1,360), POD **99.46%**, tenured workforce **94.01%**, compliance **Compliant**, and No Data metrics. Bands that would grade a Week 38 value differently from Amazon’s tier are hidden.

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
