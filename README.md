# Amazon DSP Dashboard

This repository is the single source of truth for CJMK DSP operations software.

**Canonical repo:** https://github.com/ckknighten-cjmk/amazon-dsp-dashboard

| Path | App | Stack |
| --- | --- | --- |
| Repository root | **CJMK Ops** — daily HQ for CJMK Inc. / DNA4 Memphis | Next.js App Router |
| [`apps/morning-dispatch`](apps/morning-dispatch) | Earlier Vite command center, including the Morning Dispatch Readiness Center | Vite + React |

Live CJMK Ops seeds come from Amazon DSP Console: the **Week 38** scorecard (Sep 13–19, 2026, with Week 37 still on the scorecard switcher), the **2026-10-14** Delivery Execution board, the **Week 38** 10-hour bonus list, and the **Week 38**, **Week 39**, and **Week 41** schedule workbooks used by Compliance. Fleet and incidents in CJMK Ops are still mock fixtures. Do not invent metrics that Console did not publish.

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

### Refresh

Every dashboard page has a **Refresh** control in the page header, next to that page's seed as-of time. It does two things:

1. `POST /api/refresh` with `{ page, station, week?, date? }` so an external job can pull a newer Console or ADP capture. `station` defaults to **DNA4** when it is omitted. The same page and station cannot start another pull for **10 minutes**; a different station is its own limit. The app does not call Amazon or ADP itself.
2. `router.refresh()`, which re-reads the seed modules already in this build.

The webhook key never goes to the browser. Set these on the server:

| Variable | Required | Purpose |
| --- | --- | --- |
| `REFRESH_WEBHOOK_URL` | yes | URL that receives the JSON body. |
| `REFRESH_WEBHOOK_KEY` | yes | Secret sent with that request. |
| `REFRESH_WEBHOOK_KEY_HEADER` | no | Header name for the key. Defaults to `Authorization`, and that header's value is `Bearer <key>`. Any other name sends the raw key. |

If `REFRESH_WEBHOOK_URL` or `REFRESH_WEBHOOK_KEY` is missing, `POST /api/refresh` returns **503** and the button only re-reads the current seeds. The same page and station cannot start another pull for **10 minutes**; a repeat returns **429** with `lastRequestedAt`. Copy `.env.example` for placeholders. Do not commit a real key.

After a pull is accepted the header says **Pulling fresh data… usually 5–15 min**. That note stays across reloads until the page's seed as-of time is newer than the request, which then shows **Updated** and that time. If 30 minutes pass with no newer seed, it shows **Still waiting. Sign-in may be needed.**

Page keys: `overview` (also Settings), `routes` (also a route detail page), `drivers`, `fleet`, `scorecard`, `payments`, `compliance`, `bonus`, `incidents`. `week` and `date` are sent when that page already has them.

### Stations

The station list is [`src/lib/stations.ts`](src/lib/stations.ts). Each entry has a **code**, **display name**, and **region**. **DNA4** (Memphis) is the default. **WTN2** (West Tennessee) is the station opening soon.

The header **Station** menu is on every page. The choice is stored in the `station` query (`?station=WTN2`), the `cjmk-ops-station` cookie, and the `localStorage` key of the same name. Sidebar links, the period control, the scorecard week menu, and Refresh keep it. A missing or unknown value falls back to DNA4.

WTN2 has no capture. Every page shows **No data for WTN2 yet**, and the as-of line says **No capture yet**. DNA4 figures are not copied onto that station.

#### Add a station's first seed files

DNA4 files stay in [`src/lib/data/seed/`](src/lib/data/seed/). Put a new station's files in `src/lib/data/seed/<code-lowercase>/` (WTN2 is [`src/lib/data/seed/wtn2/`](src/lib/data/seed/wtn2/)) and register one loader per dataset on `STATION_LOADERS` in [`src/lib/data/station-seeds.ts`](src/lib/data/station-seeds.ts). Pages call `loadStationDataset`. Until that loader exists, the page stays on the empty state.

```ts
WTN2: {
  routes: () => buildWtn2Routes(),
}
```

The DNA4 callback already receives the page's week when a dataset has one (`{ week }`). A WTN2 loader receives the same argument.

| Dataset | Loader key | What to add under `src/lib/data/seed/wtn2/` |
| --- | --- | --- |
| Overview | `overview` | `delivery-execution.json` in the same shape as `delivery-execution-2026-10-14.json` |
| Routes and route detail | `routes` | that delivery execution file, plus the packages-exceptions CSV |
| Scorecard | `scorecard` | `scorecard/weeks.json` (the loader receives `{ week }`) |
| 10 Hour Bonus | `bonus` | `10hr-bonus.json` (and the by-DA CSV if you keep one) |
| Drivers | `drivers` | Amazon schedule, ADP timecards, and the census file the roster reads |
| Fleet | `fleet` | `amazon-fleet.json`, `dvic.json`, and `fleet-issues/issues-YYYY-MM-DD.json` |
| Incidents | `incidents` | `incidents.json` |
| Compliance | `compliance` | weekly Amazon schedule, ADP timecard, and breaks JSON (`{ week }`) |
| Payments | `payments` | settlements, variable invoice, and work summary JSON (`{ week }` for reconcile) |
| Settings | `settings` | no file; register when the settings form should use `stationSettings` for this station |

DNA4 fleet issues stay in [`src/lib/data/seed/fleet-issues/`](src/lib/data/seed/fleet-issues/). The Fleet page loads that catalog with `loadStationDataset`, and the New damage CSV and Excel include the station in the filename and a Station column. For WTN2, put the same dated files in `src/lib/data/seed/wtn2/fleet-issues/` and register a `fleet` loader that calls `loadFleetIssueCatalog` on that directory. Until that loader exists, Fleet shows **No data for WTN2 yet** and does not read the DNA4 yard or the DNA4 issues snapshot.

CSV and Excel downloads put the station code in the filename and in a **Station** column. `POST /api/refresh` includes `station`.

### Seeded data

| Surface | Source |
| --- | --- |
| **Routes / Delivery Execution** | Amazon DSP Console Delivery Execution **refresh-final** re-pull for **2026-10-14** (captured 2026-10-18 8:49 p.m. CT; 38 routes, 3 in progress, 35 complete, 0 incomplete, associates, stops, packages, board totals) plus the exception Packages CSV (134 rows). Board package-status chips use Console totals (remaining **22**, reattemptable **0**, undeliverable **18**, missing **0**, RTS **45**, pickup failed **82**). The CSV and the embedded exception rows are the same 134 rows. Export statuses are undeliverable **15** and pickup failed **74**; those two differ from the board chips, and the UI says so. Route-row packages are **11,395** delivered of **11,427** planned. Vehicle and on-time % were **not** on the Console board — the UI leaves them unavailable and does not invent them. Execution gauges were **not visible** on this pull and stay null. Console `rescueActions` is **0**. A route is marked **Rescue: Yes** when it lists more than one associate (15 multi-transporter routes). The first associate is primary and the rest are rescuers. That column is not Amazon’s official rescue flag. Other board chips in the seed: unknown stops **23**, work-hour risk **0**, no breaks taken **3**, inactive **0**, on-road pickups **6** (0 remaining, 6 complete), ahead **1**, at risk **1**, behind **1**, paused **0**. In progress: AX110 (66/84 stops, 17 stops behind), CX276 (200/201, 1 stop behind), CX255 (191/192, 4 stops ahead). Status derived from stops done versus planned (in progress means stops remaining): those three routes are in progress; the other 35 routes are complete. |
| **Scorecard** | DSP Console Performance Summary. **Week 38 (Sep 13–19, 2026)** is the default — overall standing **84 Fantastic**. **Week 37 (Sep 6–12, 2026)** stays on the week switcher at **85.8 Fantastic**. No prior-week comparison was published, so the UI does not invent deltas. |
| **Payments** | Amazon DSP Console Flex Payments scrape captured **2026-09-21** for CJMK Inc. / DNA4. Pending action **$192,202.66** (6 invoices), visible paid total, invoice list, Week 37 variable **$88,556.70** and incentive **$3,878.88**, and YTD Insights labeled **2025** as Console displayed them. No deposit or payment-method details were in that scrape. The Week 37 variable section rollup matches the **Sep 23** variable invoice (`INV-GA6T0P-0000000614`). Week 38 Work Summary is seeded (7,865 packages, 7,860 delivered, 5 pickups, 34 routes, 2,410 miles, 0 unplanned delays). The Week 38 variable invoice was **not listed** — no invoice total is invented. |
| **Compliance** | **Week 41 (Oct 4–10, 2026)** opens by default. **Week 38 (Sep 13–19, 2026)** and **Week 39 (Sep 20–26, 2026)** stay on the same page. Amazon side is the DSP Console weekly schedule workbook (Rostered Work Blocks + Shifts & Availability). Week 38 was exported **9/22/26, 8:59:54 PM**. Week 39 was exported **9/21/26, 11:40:31 PM**. Week 41 was exported **10/13/26, 7:51:45 PM**. Week 38, Week 39, and Week 41 ADP are read-only Workforce Now **Group Timecards** for the full Sun–Sat week; individual timecards were not captured. Week 38 Breaks is summary-only (no per-DA meal rows, and work-hour nearing counts were not in the capture). Week 39 Compliance Breaks meal clocks were not in that capture; the page only joins the three associates named on the attached breaks screenshot. Week 41 Breaks is the 94-DA board (Non-compliant and Missing Punch days only; no meal clocks). **Loading any week into ADP schedule templates is deferred** and the control on the page stays disabled. |
| **Drivers** | Full roster: union of Amazon schedule associates for **Weeks 38 and 39** (transporter ID). Oct 14 Delivery Execution supplies today’s routes, packages, and status when the name matches. ADP Group Timecard names with no schedule transporter ID are included and labeled **ADP only**. Phone and email come from the ADP Employee Census (526 employees, 126 with a phone) when the name matches. The page opens on **Active**, and also keeps associates the census did not list. Terminated and deceased are labeled and available on the employment filter. Tenure and scorecard contribution were not in these exports. |
| **Fleet / incidents** | Fleet is the DNA4 **My vehicles** capture in [`src/lib/data/seed/amazon-fleet-dna4.json`](src/lib/data/seed/amazon-fleet-dna4.json): **53** vehicles from **Administration → Fleet → My vehicles** (`unit`, `plate`, `makeModel`, `vin`, `ownership`, `type`, `status`, `statusReason`, `lastRouteCompleted`, `assignedRoute`). Year and mileage were null in that export and stay blank. Rivian EDV 700 rows that Console typed as “2dr Step Van” are shown as Amazon EDV. Seven of those Rivian rows published a single identifier, stored as both the unit and the plate. DVIC for **2026-10-15** is **0** pre-trip, **0** post-trip, and **0** AVI post-trip from the dashboard `counts` in [`dvic-2026-10-15.json`](src/lib/data/seed/dvic-2026-10-15.json) (**Administration → Fleet → Dashboard → Today's vehicle inspections**, morning capture). Those inspection arrays are empty, so no per-vehicle damage rows are invented. The [`dvic-2026-10-14.json`](src/lib/data/seed/dvic-2026-10-14.json) capture stays **44 / 44 / 10**. The older [`dvic-2026-09-23.json`](src/lib/data/seed/dvic-2026-09-23.json) capture stays **0 / 0 / 0** because that dashboard listed zeros and has no `counts`. Incidents remain mock. |

Station clock is frozen at **Wed Oct 14, 2026 · 8:10 p.m. CT** (the evening-wrap Console capture time).

### Pages

- **Overview** — KPIs from the Oct 14 refresh-final Delivery Execution board (package gauge not published, remaining 22 / reattemptable 0 / undeliverable 18, 3 in-progress routes). Package delivered counts are the sum of Console route rows (11,395 of 11,427). No prior-day deltas.
- **Scorecard** — DSP Console Week 38 (default): overall 84 Fantastic, plus Safety, Quality, and Service Reliability metrics. Week 37 (85.8 Fantastic) stays on the week switcher. The top-bar period shows a week only when it overlaps that Console week. CSV export uses the values shown for the selected week. Prior week stays “Not shown in Console.”
- **10 Hour Bonus** — Week 38 delivery associates on routes with **180 or more completed stops**. **100** solo DAs have a clear route total. **115** multi-transporter rows stay flagged: the stop count is the route total, and Amazon did not say which DA completed those stops, so it is not split. CSV and Excel are associate-first (`date`, `deliveryAssociate`, `stopsCompleted`, then route). The table hides days outside the selected period.
- **Routes** — Refresh-final Delivery Execution board: 38 routes, execution gauges blank, package-status chips (remaining 22, reattemptable 0, undeliverable 18, missing 0, RTS 45, pickup failed 82), work-hour risk 0, on-road pickups 6/6, the 134-row exception-package export, and a Rescue column for 15 multi-associate routes. CSV downloads sit next to the routes and exceptions tables.
- **Drivers** — Full Weeks 38–39 schedule roster, plus ADP-only names, with Oct 14 route activity merged by name. Census phone and email attach on a unique name match. The page opens on Active. CSV export downloads the full roster, including blank phones.
- **Fleet** — 53 DNA4 vehicles from Console My vehicles. CSV export is `fleet-vehicles-dna4-console.csv`. Year and mileage stay blank. DVIC pairs pre-trip and post-trip for the same vehicle and service day and marks post-trip damage the pre-trip did not list. The Oct 15 morning dashboard capture publishes **0** pre-trip, **0** post-trip, and **0** AVI post-trip, with empty inspection lists, so the count cards show those totals and no vehicle pairs are compared. The Oct 14 file remains 44 / 44 / 10. The Sep 23 file remains 0 / 0 / 0. CSV export downloads the pairs (header only on this capture). New damage reads the newest file in [`src/lib/data/seed/fleet-issues/`](src/lib/data/seed/fleet-issues/), [`issues-2026-10-15.json`](src/lib/data/seed/fleet-issues/issues-2026-10-15.json) (1247 open issues, 0 inspection defects created 2026-10-15). [`issues-2026-10-14.json`](src/lib/data/seed/fleet-issues/issues-2026-10-14.json) stays for comparison. WTN2 has no fleet capture, so that page stays on the empty state.
- **Incidents** — Mock DVR, complaint, vehicle, and safety log
- **Payments** — Flex Payments settlements seeded **2026-09-21**: pending action, paid total, invoice table, Week 37 breakdowns, and 2025 YTD Insights. The invoice list follows the top-bar period. CSV export includes the full Console list. The reconcile compares the Week 37 variable invoice with the Work Summary Tool for Weeks 37–39. Weeks 38 and 39 have Work Summary captures and no variable invoice on the list. A Sep 13–19 period overlaps the Week 38 Work Summary; the Week 38 invoice panel stays “not yet listed.” Package units and route payments are not treated as the same counts as Work Summary packages and routes completed.
- **Compliance** — Week 41 (default), Week 38, and Week 39 ADP vs Amazon timecard exceptions: missing punches, days over 12 hours, rolling 7-day totals over 60 hours (captured ADP days only), and meal-status disagreements when per-DA break rows exist. A missing punch requires a rostered Amazon work block and no corresponding ADP punch that day. A Group Timecard row or scheduled shift without a rostered work block is not a missing punch. Week 41 ADP is the full Sun–Sat Group Timecard (Oct 4–10, 1,173 Date-column rows). Unmatched Amazon and ADP names are listed separately. Each table can be exported, and “Export week” combines missing punches, over 12, over 60, and meal rows for the selected week. ADP schedule template load is **coming later** and is not implemented.
- **Settings** — Company display name, timezone (`America/Chicago` default), theme

The sticky top bar **Today / This week** control drives Overview KPIs. The week toggle still only has Oct 14 in this Console pull.

### Swap mock / seed data for live sources later

Keep the TypeScript models in [`src/lib/types.ts`](src/lib/types.ts). Pages import only from [`src/lib/data/index.ts`](src/lib/data/index.ts).

1. Implement the `DataSource` interface in `src/lib/data/index.ts` (CSV, spreadsheet export, or your own API).
2. Point `export const source` at that implementation instead of `mockDataSource`.
3. Leave seed files under `src/lib/data/seed/` as fixtures for local demo.

Console snapshots used here live at:

- [`src/lib/data/seed/delivery-execution-2026-10-14.json`](src/lib/data/seed/delivery-execution-2026-10-14.json) — live Delivery Execution refresh-final re-pull
- [`src/lib/data/seed/packages-exceptions-2026-10-14.csv`](src/lib/data/seed/packages-exceptions-2026-10-14.csv) — Packages export for that re-pull (134 rows)
- [`src/lib/data/seed/delivery-execution-2026-10-13.json`](src/lib/data/seed/delivery-execution-2026-10-13.json) — earlier Delivery Execution evening wrap, kept in the repo
- [`src/lib/data/seed/packages-exceptions-2026-10-13.csv`](src/lib/data/seed/packages-exceptions-2026-10-13.csv) — Packages export for that earlier wrap (177 rows)
- [`src/lib/data/seed/delivery-execution-2026-09-28.json`](src/lib/data/seed/delivery-execution-2026-09-28.json) — earlier Delivery Execution evening wrap, kept in the repo
- [`src/lib/data/seed/packages-exceptions-2026-09-28.csv`](src/lib/data/seed/packages-exceptions-2026-09-28.csv) — Packages export for that earlier wrap (147 rows)
- [`src/lib/data/seed/delivery-execution-2026-09-25.json`](src/lib/data/seed/delivery-execution-2026-09-25.json) — earlier Delivery Execution evening wrap, kept in the repo
- [`src/lib/data/seed/packages-exceptions-2026-09-25.csv`](src/lib/data/seed/packages-exceptions-2026-09-25.csv) — Packages export for that earlier wrap (241 rows)
- [`src/lib/data/seed/delivery-execution-2026-09-24.json`](src/lib/data/seed/delivery-execution-2026-09-24.json) — earlier Delivery Execution evening wrap, kept in the repo
- [`src/lib/data/seed/packages-exceptions-2026-09-24.csv`](src/lib/data/seed/packages-exceptions-2026-09-24.csv) — Packages export for that earlier wrap (102 rows)
- [`src/lib/data/seed/delivery-execution-2026-09-23.json`](src/lib/data/seed/delivery-execution-2026-09-23.json) — earlier Delivery Execution capture, kept in the repo
- [`src/lib/data/seed/packages-exceptions-2026-09-23.csv`](src/lib/data/seed/packages-exceptions-2026-09-23.csv) — Packages export for that earlier wrap (114 rows)
- [`src/lib/data/seed/delivery-execution-2026-09-21.json`](src/lib/data/seed/delivery-execution-2026-09-21.json) — earlier Delivery Execution capture, kept in the repo
- [`src/lib/data/seed/packages-exceptions-2026-09-21.csv`](src/lib/data/seed/packages-exceptions-2026-09-21.csv)
- [`src/lib/data/seed/payments-settlements-2026-09-21.json`](src/lib/data/seed/payments-settlements-2026-09-21.json) — Flex Payments seed date **2026-09-21**. Week 37 variable lines are the section totals from the Sep 23 variable invoice.
- [`src/lib/data/seed/variable-invoice-week37.json`](src/lib/data/seed/variable-invoice-week37.json) — Variable invoice `INV-GA6T0P-0000000614`, Week 37, Sep 6–12 2026, total **$88,556.70**
- [`src/lib/data/seed/variable-invoice-week37.pdf`](src/lib/data/seed/variable-invoice-week37.pdf) — PDF export captured with that invoice
- [`src/lib/data/seed/work-summary-week37.json`](src/lib/data/seed/work-summary-week37.json) — Work Summary Tool, Week 37 (5,335 packages, 31 routes completed)
- [`src/lib/data/seed/work-summary-week38.json`](src/lib/data/seed/work-summary-week38.json) — Work Summary Tool, Week 38 (7,865 packages, 34 routes completed). No variable invoice was listed.
- [`src/lib/data/seed/variable-invoice-week38.json`](src/lib/data/seed/variable-invoice-week38.json) — Week 38 variable invoice status **not_listed**. No dollars.
- [`src/lib/data/seed/10hr-bonus-week38.json`](src/lib/data/seed/10hr-bonus-week38.json) — 148 Week 38 routes with 180 or more completed stops.
- [`src/lib/data/seed/10hr-bonus-week38-by-da.json`](src/lib/data/seed/10hr-bonus-week38-by-da.json) — DA-first Week 38 list: 100 solo, 115 multi-transporter (`yes`/`no`), co-drivers as captured. Stops stay the route total. CSV twin: [`10hr-bonus-week38-by-da.csv`](src/lib/data/seed/10hr-bonus-week38-by-da.csv).
- [`src/lib/data/seed/work-summary-week39.json`](src/lib/data/seed/work-summary-week39.json) — Work Summary Tool, Week 39, captured in progress with zero summary metrics. No variable invoice was listed.
- [`src/lib/data/seed/week38-amazon-schedule.xlsx`](src/lib/data/seed/week38-amazon-schedule.xlsx) — Amazon Scheduling Week 38 workbook (source for blocks and shifts)
- [`src/lib/data/seed/week38-amazon-schedule.json`](src/lib/data/seed/week38-amazon-schedule.json) — that workbook parsed with the real headers (Rostered Work Blocks and Shifts & Availability)
- [`src/lib/data/seed/adp-timecards-week38.json`](src/lib/data/seed/adp-timecards-week38.json) — ADP Group Timecard for Sep 13–19. `individualTimecards` is empty
- [`src/lib/data/seed/week38-amazon-breaks.json`](src/lib/data/seed/week38-amazon-breaks.json) — Week 38 Breaks dashboard totals only. No per-DA meal rows, and work-hour counts are null
- [`src/lib/data/seed/week39-amazon-schedule.xlsx`](src/lib/data/seed/week39-amazon-schedule.xlsx) — Amazon Scheduling Week 39 workbook (source for blocks and shifts)
- [`src/lib/data/seed/week39-amazon-schedule.json`](src/lib/data/seed/week39-amazon-schedule.json) — that workbook parsed with the real headers (Rostered Work Blocks and Shifts & Availability)
- [`src/lib/data/seed/adp-timecards-week39.json`](src/lib/data/seed/adp-timecards-week39.json) — ADP Group Timecard for Sep 20–26 (959 Date-column rows). `individualTimecards` is empty
- [`src/lib/data/seed/week39-amazon-breaks.json`](src/lib/data/seed/week39-amazon-breaks.json) — Compliance Breaks rows visible in the Week 39 screenshot, and the dashboard totals. No meal start/end times.
- [`src/lib/data/seed/week41-amazon-schedule.xlsx`](src/lib/data/seed/week41-amazon-schedule.xlsx) — Amazon Scheduling Week 41 workbook (source for blocks and shifts)
- [`src/lib/data/seed/week41-amazon-schedule.json`](src/lib/data/seed/week41-amazon-schedule.json) — that workbook parsed with the real headers (Rostered Work Blocks and Shifts & Availability)
- [`src/lib/data/seed/adp-timecards-week41.json`](src/lib/data/seed/adp-timecards-week41.json) — ADP Group Timecard for Oct 4–10 (1,173 Date-column rows). `individualTimecards` is empty
- [`src/lib/data/seed/week41-amazon-breaks.json`](src/lib/data/seed/week41-amazon-breaks.json) — Week 41 Breaks board, 94 DAs. Non-compliant and Missing Punch days only. No meal start/end times.
- [`src/lib/data/seed/dvic-2026-10-15.json`](src/lib/data/seed/dvic-2026-10-15.json) — Oct 15 Today's vehicle inspections (morning). Dashboard counts **0** pre-trip, **0** post-trip, **0** AVI post-trip. Inspection arrays are empty.
- [`src/lib/data/seed/dvic-2026-10-14.json`](src/lib/data/seed/dvic-2026-10-14.json) — Oct 14 Today's vehicle inspections, kept in the repo. Dashboard counts **44** pre-trip, **44** post-trip, **10** AVI post-trip. Inspection arrays are empty.
- [`src/lib/data/seed/fleet-issues/issues-2026-10-15.json`](src/lib/data/seed/fleet-issues/issues-2026-10-15.json) — Oct 15 open issues. **1247** rows. **0** inspection defects created that day. No detail blocks.
- [`src/lib/data/seed/fleet-issues/issues-2026-10-14.json`](src/lib/data/seed/fleet-issues/issues-2026-10-14.json) — Oct 14 open issues, kept for comparison.
- [`src/lib/data/seed/dvic-2026-09-23.json`](src/lib/data/seed/dvic-2026-09-23.json) — earlier DVIC capture, kept in the repo. Dashboard listed **0 / 0 / 0** and has no `counts`.

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
