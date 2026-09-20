# Amazon DSP Operations Command Center

Production-style operations console for an Amazon Delivery Service Partner: live routes, scorecards, P&L, safety, and staffing forecasts.

## Workspaces

- **Executive** — Revenue, profit, DCR, attendance, safety score, Amazon scorecard KPIs (DCR, CDF, POD, DNR, DSC, CE)
- **Live Operations** — Active routes, completion tracking, rescue assignment, failed deliveries, station performance
- **Driver Performance** — Scorecards, rankings, coaching, safety events, attendance
- **Financial** — Revenue, labor, overtime, fuel, vehicle cost, station and route profitability
- **Safety & Compliance** — Vehicle inspections, speeding, seatbelt, incidents
- **Forecasting** — Route, volume, staffing, and overtime outlook
- **Fleet** — Van assignments, utilization, service cadence, and pre-trips

## Quick start

```bash
npm ci
npm run dev
```

Open http://localhost:5173 and sign in with a demo role. Password for every demo account is `demo`.

| Role | Email |
| --- | --- |
| DSP Owner | owner@dsp.local |
| Operations Manager | ops@dsp.local |
| Dispatcher | dispatch@dsp.local |
| Safety Manager | safety@dsp.local |
| Finance | finance@dsp.local |
| Driver | driver@dsp.local |

Without Supabase env vars the app runs in **demo mode**: local authentication, role-based navigation, and the TypeScript seed in `src/data/seed.ts`.

## Supabase

1. Create a project and copy the URL + anon key into `.env.local` (see `.env.example`).
2. Run `supabase/schema.sql` then `supabase/seed.sql` in the SQL editor.
3. Create Auth users that match the seeded `profiles.email` values and set `profiles.auth_user_id`.

Schema includes stations, drivers, vehicles, routes, rescues, failed deliveries, attendance, safety events, inspections, incidents, coaching, daily financials, weekly scorecards, forecasts, and row-level security by role/station.

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run typecheck
npm run lint
```

## Theming

Dark mode is the default command-center theme. Use the sun/moon control in the header for light mode. The shell is mobile-responsive with a collapsible nav.
