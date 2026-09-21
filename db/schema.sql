-- Amazon DSP Scorecard Intelligence schema
-- PostgreSQL 14+. All metrics are stored in their native units:
--   DCR, POD, CDF, DNR, DSC, CE  -> percent (0-100)
--   FICO                         -> Mentor safe-driving score (300-900)
--   Safety Score                 -> composite 0-100
-- DNR is the only lower-is-better metric.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE scorecard_period_type AS ENUM ('weekly', 'monthly');
CREATE TYPE scorecard_standing AS ENUM ('fantastic', 'great', 'fair', 'poor');
CREATE TYPE metric_polarity AS ENUM ('higher_better', 'lower_better');
CREATE TYPE metric_key AS ENUM (
  'dcr',
  'pod',
  'cdf',
  'fico',
  'safety',
  'dnr',
  'dsc',
  'ce'
);

-- ---------------------------------------------------------------------------
-- scorecards
-- One fleet-level snapshot per station / period.
-- ---------------------------------------------------------------------------
CREATE TABLE scorecards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id          TEXT NOT NULL,
  station_name        TEXT NOT NULL,
  period_type         scorecard_period_type NOT NULL,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  dcr                 NUMERIC(6, 3) NOT NULL,
  pod                 NUMERIC(6, 3) NOT NULL,
  cdf                 NUMERIC(6, 3) NOT NULL,
  fico                NUMERIC(6, 2) NOT NULL,
  safety_score        NUMERIC(6, 2) NOT NULL,
  dnr                 NUMERIC(6, 3) NOT NULL,
  dsc                 NUMERIC(6, 3) NOT NULL,
  ce                  NUMERIC(6, 3) NOT NULL,
  composite_score     NUMERIC(6, 2) NOT NULL,
  standing            scorecard_standing NOT NULL,
  packages_delivered  INTEGER NOT NULL CHECK (packages_delivered >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (station_id, period_type, period_start)
);

CREATE INDEX idx_scorecards_period
  ON scorecards (period_type, period_start DESC);

-- ---------------------------------------------------------------------------
-- scorecard_history
-- Normalized time series used for trend analysis and forecasting.
-- ---------------------------------------------------------------------------
CREATE TABLE scorecard_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id    UUID REFERENCES scorecards (id) ON DELETE SET NULL,
  station_id      TEXT NOT NULL,
  period_type     scorecard_period_type NOT NULL,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  metric_key      metric_key NOT NULL,
  metric_value    NUMERIC(8, 3) NOT NULL,
  standing        scorecard_standing NOT NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (station_id, period_type, period_start, metric_key)
);

CREATE INDEX idx_scorecard_history_lookup
  ON scorecard_history (station_id, period_type, metric_key, period_start);

-- ---------------------------------------------------------------------------
-- scorecard_targets
-- Fantastic / Great / Fair thresholds (Poor is anything beyond Fair).
-- ---------------------------------------------------------------------------
CREATE TABLE scorecard_targets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key            metric_key NOT NULL UNIQUE,
  display_name          TEXT NOT NULL,
  full_name             TEXT NOT NULL,
  unit                  TEXT NOT NULL,
  polarity              metric_polarity NOT NULL,
  fantastic_threshold   NUMERIC(8, 3) NOT NULL,
  great_threshold       NUMERIC(8, 3) NOT NULL,
  fair_threshold        NUMERIC(8, 3) NOT NULL,
  effective_from        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes                 TEXT
);

-- ---------------------------------------------------------------------------
-- driver_scorecard_metrics
-- Per-driver contribution to the fleet scorecard.
-- ---------------------------------------------------------------------------
CREATE TABLE driver_scorecard_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id          UUID NOT NULL REFERENCES scorecards (id) ON DELETE CASCADE,
  driver_id             TEXT NOT NULL,
  driver_name           TEXT NOT NULL,
  primary_route         TEXT NOT NULL,
  period_type           scorecard_period_type NOT NULL,
  period_start          DATE NOT NULL,
  dcr                   NUMERIC(6, 3) NOT NULL,
  pod                   NUMERIC(6, 3) NOT NULL,
  cdf                   NUMERIC(6, 3) NOT NULL,
  fico                  NUMERIC(6, 2) NOT NULL,
  safety_score          NUMERIC(6, 2) NOT NULL,
  dnr                   NUMERIC(6, 3) NOT NULL,
  dsc                   NUMERIC(6, 3) NOT NULL,
  ce                    NUMERIC(6, 3) NOT NULL,
  packages_delivered    INTEGER NOT NULL CHECK (packages_delivered >= 0),
  stops_completed       INTEGER NOT NULL CHECK (stops_completed >= 0),
  composite_score       NUMERIC(6, 2) NOT NULL,
  standing              scorecard_standing NOT NULL,
  at_risk               BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (scorecard_id, driver_id)
);

CREATE INDEX idx_driver_scorecard_risk
  ON driver_scorecard_metrics (scorecard_id, at_risk, composite_score DESC);

-- ---------------------------------------------------------------------------
-- route_scorecard_metrics
-- Route-level scorecard performance and risk flags.
-- ---------------------------------------------------------------------------
CREATE TABLE route_scorecard_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id          UUID NOT NULL REFERENCES scorecards (id) ON DELETE CASCADE,
  route_code            TEXT NOT NULL,
  station_id            TEXT NOT NULL,
  period_type           scorecard_period_type NOT NULL,
  period_start          DATE NOT NULL,
  dcr                   NUMERIC(6, 3) NOT NULL,
  pod                   NUMERIC(6, 3) NOT NULL,
  cdf                   NUMERIC(6, 3) NOT NULL,
  fico                  NUMERIC(6, 2) NOT NULL,
  safety_score          NUMERIC(6, 2) NOT NULL,
  dnr                   NUMERIC(6, 3) NOT NULL,
  dsc                   NUMERIC(6, 3) NOT NULL,
  ce                    NUMERIC(6, 3) NOT NULL,
  packages_delivered    INTEGER NOT NULL CHECK (packages_delivered >= 0),
  stops_completed       INTEGER NOT NULL CHECK (stops_completed >= 0),
  composite_score       NUMERIC(6, 2) NOT NULL,
  standing              scorecard_standing NOT NULL,
  high_risk             BOOLEAN NOT NULL DEFAULT FALSE,
  risk_factors          TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (scorecard_id, route_code)
);

CREATE INDEX idx_route_scorecard_risk
  ON route_scorecard_metrics (scorecard_id, high_risk, composite_score);

INSERT INTO scorecard_targets (
  metric_key, display_name, full_name, unit, polarity,
  fantastic_threshold, great_threshold, fair_threshold, notes
) VALUES
  ('dcr', 'DCR', 'Delivery Completion Rate', '%', 'higher_better', 99.5, 99.0, 98.2, 'First-attempt completion'),
  ('pod', 'POD', 'Photo on Delivery', '%', 'higher_better', 98.0, 96.0, 93.0, 'Valid in-policy photos'),
  ('cdf', 'CDF', 'Customer Delivery Feedback', '%', 'higher_better', 92.0, 88.0, 82.0, 'Positive customer feedback'),
  ('fico', 'FICO', 'FICO Safe Driving Score', 'pts', 'higher_better', 850, 800, 740, 'Mentor FICO score'),
  ('safety', 'Safety', 'Safety Score', 'pts', 'higher_better', 90, 82, 74, 'Composite safety standing'),
  ('dnr', 'DNR', 'Delivered-Not-Received', '%', 'lower_better', 0.12, 0.25, 0.40, 'Lower is better'),
  ('dsc', 'DSC', 'Delivery Success Compliance', '%', 'higher_better', 99.0, 97.5, 95.5, 'Contact and exception workflow'),
  ('ce', 'CE', 'Customer Experience', '%', 'higher_better', 95.0, 92.0, 88.0, 'Composite CX score');
