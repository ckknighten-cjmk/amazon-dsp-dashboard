# Amazon DSP Dashboard

Amazon DSP Operations Command Center

## Objectives

- Executive Dashboard
- Live Operations Center
- Driver Performance
- Scorecard Intelligence (DCR, POD, CDF, FICO, Safety, DNR, DSC, CE)
- Financial Dashboard
- Safety & Compliance
- Forecasting

## Scorecard Intelligence

The `/scorecard` module tracks Amazon DSP scorecard health and includes:

1. Executive weekly/monthly scorecard and trend analysis
2. Driver impact, top performers, and at-risk drivers
3. Route-level performance and high-risk routes
4. AI recommendations for DCR, POD, CDF, and Safety
5. Four-week forecasting with warning indicators

Schema for `scorecards`, `scorecard_history`, `scorecard_targets`,
`driver_scorecard_metrics`, and `route_scorecard_metrics` lives in `db/schema.sql`.
