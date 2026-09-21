-- Amazon DSP Operations Command Center
-- Apply in the Supabase SQL editor (schema first, then seed.sql).

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum (
    'owner',
    'operations_manager',
    'dispatcher',
    'safety_manager',
    'finance',
    'driver'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.driver_status as enum (
    'on_road', 'at_station', 'break', 'delayed', 'rescued', 'off_duty'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.route_status as enum (
    'planned', 'loading', 'in_progress', 'rescue', 'completed', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.rescue_status as enum ('requested', 'in_progress', 'completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.attendance_status as enum ('present', 'late', 'absent', 'pto', 'call_out', 'no_show');
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.attendance_status add value if not exists 'no_show';
exception when others then null;
end $$;

do $$ begin
  create type public.safety_event_type as enum (
    'speeding', 'seatbelt', 'following_distance', 'sign_signal', 'distraction', 'harsh_braking'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.inspection_status as enum ('pass', 'fail', 'pending');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.incident_severity as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.score_standing as enum ('fantastic', 'great', 'fair', 'poor');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.scorecard_period_type as enum ('weekly', 'monthly');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.metric_polarity as enum ('higher_better', 'lower_better');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.metric_key as enum ('dcr', 'pod', 'cdf', 'fico', 'safety', 'dnr', 'dsc', 'ce');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.maintenance_status as enum ('scheduled', 'in_progress', 'completed', 'overdue');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.maintenance_type as enum ('preventive', 'corrective', 'tire', 'body', 'recall');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.pto_status as enum ('pending', 'approved', 'denied', 'taken');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.pto_type as enum ('vacation', 'sick', 'personal', 'unpaid');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.discipline_type as enum ('verbal', 'written', 'final', 'suspension');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.discipline_status as enum ('open', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.expense_category as enum ('fuel', 'maintenance', 'insurance', 'supplies', 'uniforms', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.expense_source as enum ('fuel_card', 'shop', 'manual', 'payroll');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.downtime_reason as enum ('maintenance', 'accident', 'inspection_fail', 'charging', 'parts');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.import_source as enum ('amazon_scorecard', 'payroll', 'fuel_card', 'fleet_maintenance');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.import_job_status as enum ('idle', 'ready', 'mapped', 'imported', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.maintenance_event_type as enum ('preventive', 'repair', 'inspection', 'damage', 'dvic');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.work_order_status as enum ('open', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.work_order_priority as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.work_order_type as enum ('preventive', 'repair', 'body', 'tire', 'recall', 'dvic');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.vehicle_status_code as enum ('new', 'active', 'maintenance', 'oos');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.repair_cost_category as enum ('parts', 'labor', 'body', 'tires', 'glass', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.employment_status as enum ('onboarding', 'active', 'offboarding', 'terminated');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.recruiting_stage as enum (
    'applied', 'phone_screen', 'interview', 'ride_along', 'offer', 'hired', 'rejected', 'withdrawn'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.recruiting_status as enum ('open', 'hired', 'rejected', 'withdrawn');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.interview_stage as enum (
    'phone_screen', 'ops_interview', 'ride_along', 'background', 'offer_review'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.interview_result as enum ('scheduled', 'passed', 'failed', 'no_show', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.training_category as enum ('onboarding', 'compliance', 'safety', 'offboarding');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.training_status as enum ('not_started', 'in_progress', 'completed', 'overdue', 'waived');
exception when duplicate_object then null;
end $$;

create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  city text not null,
  region text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text unique not null,
  full_name text not null,
  role public.app_role not null default 'driver',
  station_id uuid references public.stations(id),
  driver_id uuid,
  avatar_initials text,
  created_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  employee_code text unique not null,
  full_name text not null,
  station_id uuid not null references public.stations(id),
  hire_date date,
  status public.driver_status not null default 'off_duty',
  fico_score integer not null default 800,
  safety_score numeric(6,1) not null default 800,
  dcr numeric(5,2) not null default 99.00,
  attendance_pct numeric(5,2) not null default 98.00,
  on_time_pct numeric(5,2) not null default 97.00,
  dpmo integer not null default 300,
  seatbelt_pct numeric(5,2) not null default 99.00,
  created_at timestamptz not null default now()
);

alter table public.drivers add column if not exists employment_status public.employment_status not null default 'active';
alter table public.drivers add column if not exists termination_date date;
  drop constraint if exists profiles_driver_id_fkey;
alter table public.profiles
  add constraint profiles_driver_id_fkey
  foreign key (driver_id) references public.drivers(id) on delete set null;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  van_id text unique not null,
  vin text,
  station_id uuid not null references public.stations(id),
  year integer,
  make text,
  model text,
  status text not null default 'active' check (status in ('active', 'maintenance', 'oos')),
  powertrain text not null default 'ev' check (powertrain in ('ev', 'ice')),
  odometer_miles integer not null default 0,
  last_service_date date,
  next_service_miles integer,
  utilization_pct numeric(5,1) not null default 0,
  assigned_driver_id uuid references public.drivers(id)
);

alter table public.vehicles add column if not exists powertrain text;
alter table public.vehicles add column if not exists odometer_miles integer;
alter table public.vehicles add column if not exists last_service_date date;
alter table public.vehicles add column if not exists next_service_miles integer;
alter table public.vehicles add column if not exists utilization_pct numeric(5,1);
alter table public.vehicles add column if not exists assigned_driver_id uuid;

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  route_code text not null,
  station_id uuid not null references public.stations(id),
  driver_id uuid references public.drivers(id),
  vehicle_id uuid references public.vehicles(id),
  service_date date not null,
  status public.route_status not null default 'planned',
  stops_planned integer not null,
  stops_completed integer not null default 0,
  packages_planned integer not null,
  packages_delivered integer not null default 0,
  failed_count integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  estimated_finish timestamptz,
  unique (route_code, service_date)
);

create table if not exists public.rescues (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  distressed_route_id uuid not null references public.routes(id),
  rescue_route_id uuid references public.routes(id),
  stops_transferred integer not null,
  status public.rescue_status not null default 'requested',
  reason text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.failed_deliveries (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id),
  tracking_id text not null,
  stop_number integer,
  reason text not null,
  customer_notified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  service_date date not null,
  status public.attendance_status not null,
  scheduled_start time,
  actual_start time,
  unique (driver_id, service_date)
);

create table if not exists public.safety_events (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  vehicle_id uuid references public.vehicles(id),
  event_type public.safety_event_type not null,
  severity public.incident_severity not null,
  speed_mph integer,
  speed_limit_mph integer,
  occurred_at timestamptz not null,
  notes text
);

create table if not exists public.vehicle_inspections (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  driver_id uuid references public.drivers(id),
  inspected_at timestamptz not null,
  status public.inspection_status not null,
  defects text[] not null default '{}',
  notes text
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id),
  vehicle_id uuid references public.vehicles(id),
  station_id uuid not null references public.stations(id),
  occurred_at timestamptz not null,
  severity public.incident_severity not null,
  category text not null,
  description text not null,
  status text not null check (status in ('open', 'investigating', 'closed'))
);

create table if not exists public.coaching_recommendations (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  category text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  recommendation text not null,
  metric text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.financial_daily (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id),
  service_date date not null,
  revenue numeric(12,2) not null,
  labor_cost numeric(12,2) not null,
  overtime_cost numeric(12,2) not null,
  fuel_cost numeric(12,2) not null,
  vehicle_cost numeric(12,2) not null,
  other_cost numeric(12,2) not null default 0,
  unique (station_id, service_date)
);

create table if not exists public.scorecards (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id),
  week_start date not null,
  standing public.score_standing not null,
  dcr numeric(5,2) not null,
  cdf numeric(5,2) not null,
  pod_compliance numeric(5,2) not null,
  contact_compliance numeric(5,2) not null,
  safety_score numeric(6,1) not null,
  attendance_pct numeric(5,2) not null,
  photo_on_delivery numeric(5,2) not null,
  dnr numeric(5,2) not null default 0.20,
  dsc numeric(5,2) not null default 99.20,
  customer_escalations integer not null default 6,
  fico_score integer not null default 830,
  unique (station_id, week_start)
);

alter table public.scorecards add column if not exists dnr numeric(5,2);
alter table public.scorecards add column if not exists dsc numeric(5,2);
alter table public.scorecards add column if not exists customer_escalations integer;
alter table public.scorecards add column if not exists fico_score integer;

create table if not exists public.scorecard_history (
  id uuid primary key default gen_random_uuid(),
  scorecard_id uuid references public.scorecards (id) on delete set null,
  station_id uuid not null references public.stations (id),
  period_type public.scorecard_period_type not null,
  period_start date not null,
  period_end date not null,
  metric_key public.metric_key not null,
  metric_value numeric(8,3) not null,
  standing public.score_standing not null,
  recorded_at timestamptz not null default now(),
  unique (station_id, period_type, period_start, metric_key)
);

create table if not exists public.scorecard_targets (
  id uuid primary key default gen_random_uuid(),
  metric_key public.metric_key not null unique,
  display_name text not null,
  full_name text not null,
  unit text not null,
  polarity public.metric_polarity not null,
  fantastic_threshold numeric(8,3) not null,
  great_threshold numeric(8,3) not null,
  fair_threshold numeric(8,3) not null,
  effective_from date not null default current_date,
  notes text
);

create table if not exists public.driver_scorecard_metrics (
  id uuid primary key default gen_random_uuid(),
  scorecard_id uuid not null references public.scorecards (id) on delete cascade,
  driver_id uuid not null references public.drivers (id),
  driver_name text not null,
  primary_route text not null,
  period_type public.scorecard_period_type not null,
  period_start date not null,
  dcr numeric(6,3) not null,
  pod numeric(6,3) not null,
  cdf numeric(6,3) not null,
  fico numeric(6,2) not null,
  safety_score numeric(6,2) not null,
  dnr numeric(6,3) not null,
  dsc numeric(6,3) not null,
  ce numeric(6,3) not null,
  packages_delivered integer not null check (packages_delivered >= 0),
  stops_completed integer not null check (stops_completed >= 0),
  composite_score numeric(6,2) not null,
  standing public.score_standing not null,
  at_risk boolean not null default false,
  unique (scorecard_id, driver_id)
);

create table if not exists public.route_scorecard_metrics (
  id uuid primary key default gen_random_uuid(),
  scorecard_id uuid not null references public.scorecards (id) on delete cascade,
  route_code text not null,
  station_id uuid not null references public.stations (id),
  period_type public.scorecard_period_type not null,
  period_start date not null,
  dcr numeric(6,3) not null,
  pod numeric(6,3) not null,
  cdf numeric(6,3) not null,
  fico numeric(6,2) not null,
  safety_score numeric(6,2) not null,
  dnr numeric(6,3) not null,
  dsc numeric(6,3) not null,
  ce numeric(6,3) not null,
  packages_delivered integer not null check (packages_delivered >= 0),
  stops_completed integer not null check (stops_completed >= 0),
  composite_score numeric(6,2) not null,
  standing public.score_standing not null,
  high_risk boolean not null default false,
  risk_factors text[] not null default '{}',
  unique (scorecard_id, route_code)
);

insert into public.scorecard_targets (
  metric_key, display_name, full_name, unit, polarity,
  fantastic_threshold, great_threshold, fair_threshold, notes
) values
  ('dcr', 'DCR', 'Delivery Completion Rate', '%', 'higher_better', 99.5, 99.0, 98.2, 'First-attempt completion'),
  ('pod', 'POD', 'Photo on Delivery', '%', 'higher_better', 98.0, 96.0, 93.0, 'Valid in-policy photos'),
  ('cdf', 'CDF', 'Customer Delivery Feedback', '%', 'higher_better', 92.0, 88.0, 82.0, 'Positive customer feedback'),
  ('fico', 'FICO', 'FICO Safe Driving Score', 'pts', 'higher_better', 850, 800, 740, 'Mentor FICO score'),
  ('safety', 'Safety', 'Safety Score', 'pts', 'higher_better', 90, 82, 74, 'Composite safety standing'),
  ('dnr', 'DNR', 'Delivered-Not-Received', '%', 'lower_better', 0.12, 0.25, 0.40, 'Lower is better'),
  ('dsc', 'DSC', 'Delivery Success Compliance', '%', 'higher_better', 99.0, 97.5, 95.5, 'Contact and exception workflow'),
  ('ce', 'CE', 'Customer Experience', '%', 'higher_better', 95.0, 92.0, 88.0, 'Composite CX score')
on conflict (metric_key) do nothing;

create table if not exists public.forecasts (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id),
  forecast_date date not null,
  volume_forecast integer not null,
  volume_lower integer not null,
  volume_upper integer not null,
  volume_actual integer,
  routes_forecast integer not null,
  staffing_forecast integer not null,
  overtime_hours_forecast numeric(8,1) not null,
  unique (station_id, forecast_date)
);

create table if not exists public.route_hourly_stats (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  hour_label text not null,
  planned integer not null,
  delivered integer not null
);

create table if not exists public.maintenance_orders (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  station_id uuid not null references public.stations(id),
  work_order text unique not null,
  type public.maintenance_type not null,
  status public.maintenance_status not null default 'scheduled',
  scheduled_date date not null,
  completed_date date,
  odometer_miles integer,
  vendor text not null,
  cost numeric(12,2) not null default 0,
  downtime_hours numeric(8,1) not null default 0,
  description text not null
);

create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  station_id uuid not null references public.stations(id),
  period_start date not null,
  period_end date not null,
  regular_hours numeric(8,2) not null,
  overtime_hours numeric(8,2) not null,
  regular_pay numeric(12,2) not null,
  overtime_pay numeric(12,2) not null,
  bonuses numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null,
  unique (driver_id, period_start, period_end)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id),
  service_date date not null,
  category public.expense_category not null,
  vendor text not null,
  amount numeric(12,2) not null,
  source public.expense_source not null,
  reference text,
  notes text
);

create table if not exists public.pto_requests (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  pto_type public.pto_type not null,
  status public.pto_status not null default 'pending',
  start_date date not null,
  end_date date not null,
  hours numeric(8,1) not null,
  notes text
);

create table if not exists public.disciplinary_records (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id),
  occurred_at timestamptz not null,
  type public.discipline_type not null,
  status public.discipline_status not null default 'open',
  category text not null,
  description text not null,
  issued_by text not null
);

create table if not exists public.vehicle_downtime (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  station_id uuid not null references public.stations(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  reason public.downtime_reason not null,
  hours numeric(8,1) not null,
  notes text
);

create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  station_id uuid not null references public.stations(id),
  wo_number text unique not null,
  title text not null,
  description text not null,
  type public.work_order_type not null,
  status public.work_order_status not null default 'open',
  priority public.work_order_priority not null default 'medium',
  opened_at date not null,
  due_at date not null,
  completed_at date,
  shop text not null,
  estimated_hours numeric(8,1) not null default 0,
  actual_hours numeric(8,1)
);

create table if not exists public.maintenance_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  station_id uuid not null references public.stations(id),
  work_order_id uuid references public.work_orders(id) on delete set null,
  event_type public.maintenance_event_type not null,
  occurred_at timestamptz not null,
  odometer_miles integer not null default 0,
  title text not null,
  description text not null,
  downtime_hours numeric(8,1) not null default 0,
  technician text not null
);

create table if not exists public.vehicle_status_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  from_status public.vehicle_status_code not null,
  to_status public.vehicle_status_code not null,
  changed_at timestamptz not null,
  reason text not null,
  changed_by text not null
);

create table if not exists public.repair_costs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  category public.repair_cost_category not null,
  amount numeric(12,2) not null,
  incurred_at date not null,
  vendor text not null,
  description text not null
);

create table if not exists public.recruiting (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id),
  driver_id uuid references public.drivers(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  source text not null,
  role text not null default 'driver_associate',
  stage public.recruiting_stage not null default 'applied',
  status public.recruiting_status not null default 'open',
  applied_at date not null,
  recruiter text not null,
  notes text
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  recruiting_id uuid not null references public.recruiting(id) on delete cascade,
  stage public.interview_stage not null,
  scheduled_at timestamptz not null,
  interviewer text not null,
  result public.interview_result not null default 'scheduled',
  score numeric(5,1),
  notes text
);

create table if not exists public.training_records (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id) on delete set null,
  recruiting_id uuid references public.recruiting(id) on delete set null,
  course text not null,
  category public.training_category not null,
  status public.training_status not null default 'not_started',
  started_at date,
  completed_at date,
  due_date date not null,
  score numeric(5,1),
  required boolean not null default true
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  source public.import_source unique not null,
  status public.import_job_status not null default 'idle',
  last_run_at timestamptz,
  next_run_at timestamptz,
  records_imported integer not null default 0,
  records_failed integer not null default 0,
  mapping_notes text,
  connector text not null
);

create index if not exists routes_service_date_idx on public.routes (service_date, station_id);
create index if not exists routes_driver_date_idx on public.routes (driver_id, service_date);
create index if not exists financial_daily_date_idx on public.financial_daily (service_date);
create index if not exists safety_events_occurred_idx on public.safety_events (occurred_at desc);
create index if not exists attendance_date_idx on public.attendance (service_date, driver_id);
create index if not exists forecasts_date_idx on public.forecasts (forecast_date, station_id);
create index if not exists scorecards_week_idx on public.scorecards (week_start desc);
create index if not exists scorecard_history_lookup_idx
  on public.scorecard_history (station_id, period_type, metric_key, period_start);
create index if not exists driver_scorecard_risk_idx
  on public.driver_scorecard_metrics (scorecard_id, at_risk, composite_score desc);
create index if not exists route_scorecard_risk_idx
  on public.route_scorecard_metrics (scorecard_id, high_risk, composite_score);
create index if not exists maintenance_station_idx on public.maintenance_orders (station_id, scheduled_date);
create index if not exists payroll_period_idx on public.payroll (period_start, station_id);
create index if not exists expenses_date_idx on public.expenses (service_date, station_id);
create index if not exists pto_driver_idx on public.pto_requests (driver_id, start_date);
create index if not exists downtime_vehicle_idx on public.vehicle_downtime (vehicle_id, started_at desc);
create index if not exists work_orders_station_idx on public.work_orders (station_id, due_at);
create index if not exists maintenance_events_vehicle_idx on public.maintenance_events (vehicle_id, occurred_at desc);
create index if not exists vehicle_status_history_idx on public.vehicle_status_history (vehicle_id, changed_at desc);
create index if not exists repair_costs_vehicle_idx on public.repair_costs (vehicle_id, incurred_at desc);
create index if not exists recruiting_station_idx on public.recruiting (station_id, stage, status);
create index if not exists interviews_recruiting_idx on public.interviews (recruiting_id, scheduled_at);
create index if not exists training_driver_idx on public.training_records (driver_id, category, status);

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.current_profile()
$$;

create or replace function public.current_station_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select station_id from public.current_profile()
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select public.current_app_role() = 'owner'
$$;

create or replace function public.can_read_station(target uuid)
returns boolean
language sql
stable
as $$
  select
    public.current_app_role() in ('owner', 'finance', 'safety_manager')
    or public.current_station_id() is null
    or public.current_station_id() = target
$$;

alter table public.stations enable row level security;
alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.routes enable row level security;
alter table public.rescues enable row level security;
alter table public.failed_deliveries enable row level security;
alter table public.attendance enable row level security;
alter table public.safety_events enable row level security;
alter table public.vehicle_inspections enable row level security;
alter table public.incidents enable row level security;
alter table public.coaching_recommendations enable row level security;
alter table public.financial_daily enable row level security;
alter table public.scorecards enable row level security;
alter table public.scorecard_history enable row level security;
alter table public.scorecard_targets enable row level security;
alter table public.driver_scorecard_metrics enable row level security;
alter table public.route_scorecard_metrics enable row level security;
alter table public.forecasts enable row level security;
alter table public.route_hourly_stats enable row level security;
alter table public.maintenance_orders enable row level security;
alter table public.payroll enable row level security;
alter table public.expenses enable row level security;
alter table public.pto_requests enable row level security;
alter table public.disciplinary_records enable row level security;
alter table public.vehicle_downtime enable row level security;
alter table public.import_jobs enable row level security;
alter table public.work_orders enable row level security;
alter table public.maintenance_events enable row level security;
alter table public.vehicle_status_history enable row level security;
alter table public.repair_costs enable row level security;
alter table public.recruiting enable row level security;
alter table public.interviews enable row level security;
alter table public.training_records enable row level security;

drop policy if exists stations_select on public.stations;
create policy stations_select on public.stations
  for select to authenticated
  using (public.can_read_station(id) or public.current_app_role() is not null);

drop policy if exists stations_write on public.stations;
create policy stations_write on public.stations
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (auth_user_id = auth.uid() or public.is_owner() or public.current_app_role() in ('operations_manager', 'safety_manager'));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists drivers_select on public.drivers;
create policy drivers_select on public.drivers
  for select to authenticated
  using (
    public.can_read_station(station_id)
    or id = (select driver_id from public.current_profile())
  );

drop policy if exists drivers_write on public.drivers;
create policy drivers_write on public.drivers
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager'));

drop policy if exists vehicles_select on public.vehicles;
create policy vehicles_select on public.vehicles
  for select to authenticated
  using (public.can_read_station(station_id));

drop policy if exists vehicles_write on public.vehicles;
create policy vehicles_write on public.vehicles
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'));

drop policy if exists routes_select on public.routes;
create policy routes_select on public.routes
  for select to authenticated
  using (public.can_read_station(station_id));

drop policy if exists routes_write on public.routes;
create policy routes_write on public.routes
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'dispatcher'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'dispatcher'));

drop policy if exists rescues_select on public.rescues;
create policy rescues_select on public.rescues
  for select to authenticated
  using (
    exists (
      select 1 from public.routes r
      where r.id = distressed_route_id and public.can_read_station(r.station_id)
    )
  );

drop policy if exists rescues_write on public.rescues;
create policy rescues_write on public.rescues
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'dispatcher'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'dispatcher'));

drop policy if exists failed_select on public.failed_deliveries;
create policy failed_select on public.failed_deliveries
  for select to authenticated
  using (
    exists (
      select 1 from public.routes r
      where r.id = route_id and public.can_read_station(r.station_id)
    )
  );

drop policy if exists failed_write on public.failed_deliveries;
create policy failed_write on public.failed_deliveries
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'dispatcher'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'dispatcher'));

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
  for select to authenticated
  using (
    driver_id = (select driver_id from public.current_profile())
    or exists (
      select 1 from public.drivers d
      where d.id = driver_id and public.can_read_station(d.station_id)
    )
  );

drop policy if exists attendance_write on public.attendance;
create policy attendance_write on public.attendance
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'dispatcher'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'dispatcher'));

drop policy if exists safety_select on public.safety_events;
create policy safety_select on public.safety_events
  for select to authenticated
  using (
    exists (
      select 1 from public.drivers d
      where d.id = driver_id and public.can_read_station(d.station_id)
    )
  );

drop policy if exists safety_write on public.safety_events;
create policy safety_write on public.safety_events
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'));

drop policy if exists inspections_select on public.vehicle_inspections;
create policy inspections_select on public.vehicle_inspections
  for select to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and public.can_read_station(v.station_id)
    )
  );

drop policy if exists inspections_write on public.vehicle_inspections;
create policy inspections_write on public.vehicle_inspections
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager', 'dispatcher'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager', 'dispatcher'));

drop policy if exists incidents_select on public.incidents;
create policy incidents_select on public.incidents
  for select to authenticated
  using (public.can_read_station(station_id));

drop policy if exists incidents_write on public.incidents;
create policy incidents_write on public.incidents
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'));

drop policy if exists coaching_select on public.coaching_recommendations;
create policy coaching_select on public.coaching_recommendations
  for select to authenticated
  using (
    driver_id = (select driver_id from public.current_profile())
    or exists (
      select 1 from public.drivers d
      where d.id = driver_id and public.can_read_station(d.station_id)
    )
  );

drop policy if exists coaching_write on public.coaching_recommendations;
create policy coaching_write on public.coaching_recommendations
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'));

drop policy if exists financial_select on public.financial_daily;
create policy financial_select on public.financial_daily
  for select to authenticated
  using (public.current_app_role() in ('owner', 'finance') and public.can_read_station(station_id));

drop policy if exists financial_write on public.financial_daily;
create policy financial_write on public.financial_daily
  for all to authenticated
  using (public.current_app_role() in ('owner', 'finance'))
  with check (public.current_app_role() in ('owner', 'finance'));

drop policy if exists scorecards_select on public.scorecards;
create policy scorecards_select on public.scorecards
  for select to authenticated
  using (public.can_read_station(station_id));

drop policy if exists scorecards_write on public.scorecards;
create policy scorecards_write on public.scorecards
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager'));

drop policy if exists scorecard_history_select on public.scorecard_history;
create policy scorecard_history_select on public.scorecard_history
  for select to authenticated
  using (public.can_read_station(station_id));

drop policy if exists scorecard_history_write on public.scorecard_history;
create policy scorecard_history_write on public.scorecard_history
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager'));

drop policy if exists scorecard_targets_select on public.scorecard_targets;
create policy scorecard_targets_select on public.scorecard_targets
  for select to authenticated
  using (public.current_app_role() is not null);

drop policy if exists scorecard_targets_write on public.scorecard_targets;
create policy scorecard_targets_write on public.scorecard_targets
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager'));

drop policy if exists driver_scorecard_select on public.driver_scorecard_metrics;
create policy driver_scorecard_select on public.driver_scorecard_metrics
  for select to authenticated
  using (
    public.current_app_role() in ('owner', 'operations_manager', 'safety_manager')
    or (
      public.current_app_role() = 'driver'
      and driver_id = (select driver_id from public.current_profile())
    )
  );

drop policy if exists driver_scorecard_write on public.driver_scorecard_metrics;
create policy driver_scorecard_write on public.driver_scorecard_metrics
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager'));

drop policy if exists route_scorecard_select on public.route_scorecard_metrics;
create policy route_scorecard_select on public.route_scorecard_metrics
  for select to authenticated
  using (public.can_read_station(station_id));

drop policy if exists route_scorecard_write on public.route_scorecard_metrics;
create policy route_scorecard_write on public.route_scorecard_metrics
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager'));

drop policy if exists forecasts_select on public.forecasts;
create policy forecasts_select on public.forecasts
  for select to authenticated
  using (
    public.current_app_role() in ('owner', 'operations_manager', 'finance')
    and public.can_read_station(station_id)
  );

drop policy if exists forecasts_write on public.forecasts;
create policy forecasts_write on public.forecasts
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'finance'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'finance'));

drop policy if exists hourly_select on public.route_hourly_stats;
create policy hourly_select on public.route_hourly_stats
  for select to authenticated
  using (public.current_app_role() is not null);

drop policy if exists maintenance_select on public.maintenance_orders;
create policy maintenance_select on public.maintenance_orders
  for select to authenticated
  using (public.can_read_station(station_id));

drop policy if exists maintenance_write on public.maintenance_orders;
create policy maintenance_write on public.maintenance_orders
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'));

drop policy if exists payroll_select on public.payroll;
create policy payroll_select on public.payroll
  for select to authenticated
  using (
    public.current_app_role() in ('owner', 'finance')
    and public.can_read_station(station_id)
  );

drop policy if exists payroll_write on public.payroll;
create policy payroll_write on public.payroll
  for all to authenticated
  using (public.current_app_role() in ('owner', 'finance'))
  with check (public.current_app_role() in ('owner', 'finance'));

drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses
  for select to authenticated
  using (
    public.current_app_role() in ('owner', 'finance')
    and public.can_read_station(station_id)
  );

drop policy if exists expenses_write on public.expenses;
create policy expenses_write on public.expenses
  for all to authenticated
  using (public.current_app_role() in ('owner', 'finance'))
  with check (public.current_app_role() in ('owner', 'finance'));

drop policy if exists pto_select on public.pto_requests;
create policy pto_select on public.pto_requests
  for select to authenticated
  using (
    driver_id = (select driver_id from public.current_profile())
    or exists (
      select 1 from public.drivers d
      where d.id = driver_id and public.can_read_station(d.station_id)
    )
  );

drop policy if exists pto_write on public.pto_requests;
create policy pto_write on public.pto_requests
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager'));

drop policy if exists discipline_select on public.disciplinary_records;
create policy discipline_select on public.disciplinary_records
  for select to authenticated
  using (
    driver_id = (select driver_id from public.current_profile())
    or exists (
      select 1 from public.drivers d
      where d.id = driver_id and public.can_read_station(d.station_id)
    )
  );

drop policy if exists discipline_write on public.disciplinary_records;
create policy discipline_write on public.disciplinary_records
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'));

drop policy if exists downtime_select on public.vehicle_downtime;
create policy downtime_select on public.vehicle_downtime
  for select to authenticated
  using (public.can_read_station(station_id));

drop policy if exists downtime_write on public.vehicle_downtime;
create policy downtime_write on public.vehicle_downtime
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'));

drop policy if exists work_orders_select on public.work_orders;
create policy work_orders_select on public.work_orders
  for select to authenticated
  using (public.can_read_station(station_id));

drop policy if exists work_orders_write on public.work_orders;
create policy work_orders_write on public.work_orders
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager', 'dispatcher'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager', 'dispatcher'));

drop policy if exists maintenance_events_select on public.maintenance_events;
create policy maintenance_events_select on public.maintenance_events
  for select to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and public.can_read_station(v.station_id)
    )
  );

drop policy if exists maintenance_events_write on public.maintenance_events;
create policy maintenance_events_write on public.maintenance_events
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager', 'dispatcher'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager', 'dispatcher'));

drop policy if exists vehicle_status_history_select on public.vehicle_status_history;
create policy vehicle_status_history_select on public.vehicle_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and public.can_read_station(v.station_id)
    )
  );

drop policy if exists vehicle_status_history_write on public.vehicle_status_history;
create policy vehicle_status_history_write on public.vehicle_status_history
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager', 'dispatcher'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager', 'dispatcher'));

drop policy if exists repair_costs_select on public.repair_costs;
create policy repair_costs_select on public.repair_costs
  for select to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and public.can_read_station(v.station_id)
    )
  );

drop policy if exists repair_costs_write on public.repair_costs;
create policy repair_costs_write on public.repair_costs
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'finance', 'safety_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'finance', 'safety_manager'));

drop policy if exists recruiting_select on public.recruiting;
create policy recruiting_select on public.recruiting
  for select to authenticated
  using (
    public.current_app_role() in ('owner', 'operations_manager', 'dispatcher')
    and public.can_read_station(station_id)
  );

drop policy if exists recruiting_write on public.recruiting;
create policy recruiting_write on public.recruiting
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager'));

drop policy if exists interviews_select on public.interviews;
create policy interviews_select on public.interviews
  for select to authenticated
  using (
    exists (
      select 1 from public.recruiting r
      where r.id = recruiting_id
        and public.current_app_role() in ('owner', 'operations_manager', 'dispatcher')
        and public.can_read_station(r.station_id)
    )
  );

drop policy if exists interviews_write on public.interviews;
create policy interviews_write on public.interviews
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager'));

drop policy if exists training_select on public.training_records;
create policy training_select on public.training_records
  for select to authenticated
  using (
    driver_id = (select driver_id from public.current_profile())
    or exists (
      select 1 from public.drivers d
      where d.id = driver_id and public.can_read_station(d.station_id)
    )
    or exists (
      select 1 from public.recruiting r
      where r.id = recruiting_id and public.can_read_station(r.station_id)
    )
  );

drop policy if exists training_write on public.training_records;
create policy training_write on public.training_records
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'safety_manager'));

drop policy if exists import_jobs_select on public.import_jobs;
create policy import_jobs_select on public.import_jobs
  for select to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'finance'));

drop policy if exists import_jobs_write on public.import_jobs;
create policy import_jobs_write on public.import_jobs
  for all to authenticated
  using (public.current_app_role() in ('owner', 'operations_manager', 'finance'))
  with check (public.current_app_role() in ('owner', 'operations_manager', 'finance'));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
