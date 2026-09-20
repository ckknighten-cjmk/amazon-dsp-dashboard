-- Mock seed for Amazon DSP Operations Command Center
-- Run after schema.sql. Safe to re-run: deletes DSP operational rows first.

begin;

delete from public.route_hourly_stats;
delete from public.forecasts;
delete from public.scorecards;
delete from public.financial_daily;
delete from public.coaching_recommendations;
delete from public.incidents;
delete from public.vehicle_inspections;
delete from public.safety_events;
delete from public.attendance;
delete from public.failed_deliveries;
delete from public.rescues;
delete from public.routes;
delete from public.profiles;
delete from public.vehicles;
delete from public.drivers;
delete from public.stations;

insert into public.stations (id, code, name, city, region) values
  ('a0000000-0000-4000-8000-000000000001', 'DLA7', 'Los Angeles', 'Los Angeles', 'US-West'),
  ('a0000000-0000-4000-8000-000000000002', 'DAX5', 'Phoenix', 'Phoenix', 'US-West'),
  ('a0000000-0000-4000-8000-000000000003', 'DSE2', 'Seattle', 'Seattle', 'US-West'),
  ('a0000000-0000-4000-8000-000000000004', 'DAT6', 'Atlanta', 'Atlanta', 'US-East'),
  ('a0000000-0000-4000-8000-000000000005', 'DCH1', 'Chicago', 'Chicago', 'US-Central');

insert into public.drivers (
  id, employee_code, full_name, station_id, hire_date, status,
  fico_score, safety_score, dcr, attendance_pct, on_time_pct, dpmo, seatbelt_pct
) values
  ('b0000000-0000-4000-8000-000000001042', 'DRV-1042', 'Maya Alvarez', 'a0000000-0000-4000-8000-000000000001', '2023-03-12', 'on_road', 872, 918, 99.4, 99.1, 98.4, 210, 99.8),
  ('b0000000-0000-4000-8000-000000001088', 'DRV-1088', 'Kwame Osei', 'a0000000-0000-4000-8000-000000000001', '2022-11-04', 'on_road', 841, 874, 98.9, 97.4, 96.1, 480, 98.6),
  ('b0000000-0000-4000-8000-000000001103', 'DRV-1103', 'Jiro Nakamura', 'a0000000-0000-4000-8000-000000000001', '2021-06-18', 'at_station', 901, 946, 99.7, 99.6, 99.2, 90, 100),
  ('b0000000-0000-4000-8000-000000001156', 'DRV-1156', 'Sofia Petrova', 'a0000000-0000-4000-8000-000000000002', '2024-01-22', 'delayed', 764, 742, 97.1, 94.2, 91.5, 1120, 96.4),
  ('b0000000-0000-4000-8000-000000001177', 'DRV-1177', 'David Okafor', 'a0000000-0000-4000-8000-000000000002', '2023-08-09', 'on_road', 858, 889, 99.1, 98.3, 97.7, 260, 99.2),
  ('b0000000-0000-4000-8000-000000001201', 'DRV-1201', 'Lina Chen', 'a0000000-0000-4000-8000-000000000002', '2022-04-30', 'break', 812, 831, 98.4, 93.8, 95.0, 640, 98.1),
  ('b0000000-0000-4000-8000-000000001210', 'DRV-1210', 'Ravi Singh', 'a0000000-0000-4000-8000-000000000003', '2023-02-14', 'on_road', 866, 902, 99.3, 98.8, 98.1, 180, 99.5),
  ('b0000000-0000-4000-8000-000000001224', 'DRV-1224', 'Ama Mensah', 'a0000000-0000-4000-8000-000000000003', '2022-09-01', 'on_road', 848, 861, 98.8, 97.9, 96.8, 310, 99.0),
  ('b0000000-0000-4000-8000-000000001238', 'DRV-1238', 'Tyler Brooks', 'a0000000-0000-4000-8000-000000000003', '2024-05-06', 'rescued', 779, 768, 97.6, 95.1, 92.4, 870, 97.2),
  ('b0000000-0000-4000-8000-000000001252', 'DRV-1252', 'Nina Vargas', 'a0000000-0000-4000-8000-000000000004', '2023-07-19', 'on_road', 854, 887, 99.0, 98.0, 97.2, 240, 99.3),
  ('b0000000-0000-4000-8000-000000001266', 'DRV-1266', 'Harsh Patel', 'a0000000-0000-4000-8000-000000000004', '2021-12-02', 'off_duty', 890, 921, 99.5, 96.4, 98.6, 150, 99.7),
  ('b0000000-0000-4000-8000-000000001280', 'DRV-1280', 'Eva Kowalski', 'a0000000-0000-4000-8000-000000000005', '2022-02-28', 'on_road', 837, 852, 98.7, 97.1, 96.4, 390, 98.8),
  ('b0000000-0000-4000-8000-000000001294', 'DRV-1294', 'Chris Nguyen', 'a0000000-0000-4000-8000-000000000005', '2023-10-11', 'on_road', 861, 894, 99.2, 98.5, 97.9, 220, 99.4),
  ('b0000000-0000-4000-8000-000000001308', 'DRV-1308', 'Pablo Romero', 'a0000000-0000-4000-8000-000000000005', '2024-03-03', 'off_duty', 748, 711, 96.8, 91.6, 90.8, 1340, 95.1);

insert into public.vehicles (id, van_id, vin, station_id, year, make, model, status)
select
  ('c0000000-0000-4000-8000-0000000000' || lpad(gs::text, 2, '0'))::uuid,
  'EV-' || (209 + gs),
  '1FTBW3U60PKA' || (10000 + gs),
  d.station_id,
  2023,
  'Ford',
  'E-Transit',
  case when d.employee_code = 'DRV-1308' then 'maintenance' else 'active' end
from generate_series(1, 14) gs
join public.drivers d on d.employee_code = ('DRV-' || (array[
  '1042','1088','1103','1156','1177','1201','1210','1224','1238','1252','1266','1280','1294','1308'
])[gs]);

insert into public.profiles (email, full_name, role, station_id, driver_id, avatar_initials) values
  ('owner@dsp.local', 'Alex Rivera', 'owner', null, null, 'AR'),
  ('ops@dsp.local', 'Jordan Hale', 'operations_manager', 'a0000000-0000-4000-8000-000000000001', null, 'JH'),
  ('dispatch@dsp.local', 'Sam Okonkwo', 'dispatcher', 'a0000000-0000-4000-8000-000000000001', null, 'SO'),
  ('safety@dsp.local', 'Riley Cho', 'safety_manager', null, null, 'RC'),
  ('finance@dsp.local', 'Morgan Ellis', 'finance', null, null, 'ME'),
  ('driver@dsp.local', 'Maya Alvarez', 'driver', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000001042', 'MA');

insert into public.routes (
  id, route_code, station_id, driver_id, vehicle_id, service_date, status,
  stops_planned, stops_completed, packages_planned, packages_delivered, failed_count, started_at, completed_at, estimated_finish
) values
  ('d0000000-0000-4000-8000-000000000014', 'CX-14', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000001042', 'c0000000-0000-4000-8000-000000000001', '2026-09-20', 'in_progress', 190, 168, 1260, 1118, 2, '2026-09-20 07:12+00', null, '2026-09-20 18:40+00'),
  ('d0000000-0000-4000-8000-000000000022', 'CX-22', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000001088', 'c0000000-0000-4000-8000-000000000002', '2026-09-20', 'in_progress', 175, 152, 1140, 988, 3, '2026-09-20 07:18+00', null, '2026-09-20 19:05+00'),
  ('d0000000-0000-4000-8000-000000000007', 'CX-07', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000001103', 'c0000000-0000-4000-8000-000000000003', '2026-09-20', 'completed', 200, 200, 1340, 1331, 1, '2026-09-20 06:58+00', '2026-09-20 16:42+00', '2026-09-20 17:10+00'),
  ('d0000000-0000-4000-8000-000000000031', 'CX-31', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000001156', 'c0000000-0000-4000-8000-000000000004', '2026-09-20', 'in_progress', 185, 120, 1210, 764, 6, '2026-09-20 07:41+00', null, '2026-09-20 20:15+00'),
  ('d0000000-0000-4000-8000-000000000005', 'CX-05', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000001177', 'c0000000-0000-4000-8000-000000000005', '2026-09-20', 'in_progress', 168, 143, 1095, 931, 2, '2026-09-20 07:08+00', null, '2026-09-20 18:20+00'),
  ('d0000000-0000-4000-8000-000000000018', 'CX-18', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000001201', 'c0000000-0000-4000-8000-000000000006', '2026-09-20', 'in_progress', 160, 90, 1020, 574, 1, '2026-09-20 07:22+00', null, '2026-09-20 19:30+00'),
  ('d0000000-0000-4000-8000-000000000011', 'CX-11', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000001210', 'c0000000-0000-4000-8000-000000000007', '2026-09-20', 'in_progress', 178, 149, 1165, 972, 1, '2026-09-20 07:05+00', null, '2026-09-20 18:10+00'),
  ('d0000000-0000-4000-8000-000000000009', 'CX-09', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000001224', 'c0000000-0000-4000-8000-000000000008', '2026-09-20', 'in_progress', 182, 133, 1190, 861, 0, '2026-09-20 07:11+00', null, '2026-09-20 19:00+00'),
  ('d0000000-0000-4000-8000-000000000027', 'CX-27', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000001238', 'c0000000-0000-4000-8000-000000000009', '2026-09-20', 'rescue', 196, 104, 1288, 671, 4, '2026-09-20 07:33+00', null, '2026-09-20 20:45+00'),
  ('d0000000-0000-4000-8000-000000000003', 'CX-03', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000001252', 'c0000000-0000-4000-8000-000000000010', '2026-09-20', 'in_progress', 170, 138, 1104, 896, 2, '2026-09-20 07:16+00', null, '2026-09-20 18:35+00'),
  ('d0000000-0000-4000-8000-000000000016', 'CX-16', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000001280', 'c0000000-0000-4000-8000-000000000012', '2026-09-20', 'in_progress', 174, 141, 1135, 918, 3, '2026-09-20 07:09+00', null, '2026-09-20 18:50+00'),
  ('d0000000-0000-4000-8000-000000000021', 'CX-21', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000001294', 'c0000000-0000-4000-8000-000000000013', '2026-09-20', 'in_progress', 188, 157, 1220, 1014, 1, '2026-09-20 07:04+00', null, '2026-09-20 18:25+00');

insert into public.rescues (service_date, distressed_route_id, rescue_route_id, stops_transferred, status, reason, requested_at, completed_at) values
  ('2026-09-20', 'd0000000-0000-4000-8000-000000000027', 'd0000000-0000-4000-8000-000000000009', 28, 'in_progress', 'Behind pace after delayed wave departure', '2026-09-20 14:18+00', null),
  ('2026-09-20', 'd0000000-0000-4000-8000-000000000031', null, 22, 'requested', 'High remaining stops + access issues', '2026-09-20 15:02+00', null),
  ('2026-09-20', 'd0000000-0000-4000-8000-000000000018', 'd0000000-0000-4000-8000-000000000005', 16, 'completed', 'Meal break overrun, restored to plan', '2026-09-20 12:40+00', '2026-09-20 13:55+00');

insert into public.failed_deliveries (route_id, tracking_id, stop_number, reason, customer_notified, created_at) values
  ('d0000000-0000-4000-8000-000000000031', 'TBA308441029847', 64, 'Access problem', true, '2026-09-20 11:14+00'),
  ('d0000000-0000-4000-8000-000000000031', 'TBA308441029901', 88, 'Customer unavailable', true, '2026-09-20 13:22+00'),
  ('d0000000-0000-4000-8000-000000000031', 'TBA308441030112', 101, 'Business closed', false, '2026-09-20 14:05+00'),
  ('d0000000-0000-4000-8000-000000000027', 'TBA308441031440', 77, 'Unsafe location', true, '2026-09-20 12:48+00'),
  ('d0000000-0000-4000-8000-000000000027', 'TBA308441031512', 92, 'Incorrect address', false, '2026-09-20 13:36+00'),
  ('d0000000-0000-4000-8000-000000000022', 'TBA308441032008', 54, 'Customer unavailable', true, '2026-09-20 10:51+00'),
  ('d0000000-0000-4000-8000-000000000016', 'TBA308441032774', 119, 'Access problem', true, '2026-09-20 15:11+00'),
  ('d0000000-0000-4000-8000-000000000014', 'TBA308441033091', 142, 'Weather delay', false, '2026-09-20 15:44+00'),
  ('d0000000-0000-4000-8000-000000000007', 'TBA308441028611', 198, 'Business closed', true, '2026-09-20 16:12+00'),
  ('d0000000-0000-4000-8000-000000000003', 'TBA308441034220', 61, 'Customer unavailable', true, '2026-09-20 11:39+00');

insert into public.attendance (driver_id, service_date, status, scheduled_start, actual_start)
select d.id, day::date,
  (array['present','present','present','late','present','present','present'])[extract(dow from day)::int + 1]::attendance_status,
  '07:00',
  case when extract(dow from day) = 3 then '07:18' else '06:52' end
from public.drivers d
cross join generate_series('2026-09-14'::date, '2026-09-20'::date, interval '1 day') day;

insert into public.safety_events (driver_id, vehicle_id, event_type, severity, speed_mph, speed_limit_mph, occurred_at, notes)
select 'b0000000-0000-4000-8000-000000001156', 'c0000000-0000-4000-8000-000000000004', 'speeding', 'high', 48, 35, '2026-09-20 10:22+00', 'Residential zone, 13 over'
union all select 'b0000000-0000-4000-8000-000000001156', 'c0000000-0000-4000-8000-000000000004', 'seatbelt', 'medium', null, null, '2026-09-18 09:14+00', 'Unbuckled for 46 seconds'
union all select 'b0000000-0000-4000-8000-000000001238', 'c0000000-0000-4000-8000-000000000009', 'speeding', 'medium', 41, 30, '2026-09-20 11:08+00', 'School zone buffer'
union all select 'b0000000-0000-4000-8000-000000001308', 'c0000000-0000-4000-8000-000000000014', 'distraction', 'high', null, null, '2026-09-16 13:02+00', 'Phone handling while moving'
union all select 'b0000000-0000-4000-8000-000000001201', 'c0000000-0000-4000-8000-000000000006', 'sign_signal', 'low', null, null, '2026-09-17 16:27+00', 'Rolling stop'
union all select 'b0000000-0000-4000-8000-000000001088', 'c0000000-0000-4000-8000-000000000002', 'harsh_braking', 'low', 28, 25, '2026-09-20 08:47+00', 'Pedestrian dart-out'
union all select 'b0000000-0000-4000-8000-000000001280', 'c0000000-0000-4000-8000-000000000012', 'speeding', 'low', 38, 30, '2026-09-15 12:11+00', '8 over posted'
union all select 'b0000000-0000-4000-8000-000000001308', 'c0000000-0000-4000-8000-000000000014', 'seatbelt', 'high', null, null, '2026-09-14 10:03+00', 'Unbuckled while rolling';

insert into public.vehicle_inspections (vehicle_id, driver_id, inspected_at, status, defects, notes)
select v.id, d.id, '2026-09-20 06:15+00',
  case when v.status = 'maintenance' then 'fail'::inspection_status else 'pass'::inspection_status end,
  case when v.status = 'maintenance' then array['Brake warning light'] else '{}'::text[] end,
  'Pre-trip'
from public.vehicles v
join public.drivers d on d.station_id = v.station_id
  and d.employee_code = ('DRV-' || (array[
    '1042','1088','1103','1156','1177','1201','1210','1224','1238','1252','1266','1280','1294','1308'
  ])[(regexp_replace(v.van_id, '\D', '', 'g')::int - 209)]);

insert into public.incidents (driver_id, vehicle_id, station_id, occurred_at, severity, category, description, status) values
  ('b0000000-0000-4000-8000-000000001156', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', '2026-09-18 15:28+00', 'medium', 'property', 'Mirror contact with HOA gate arm. No injury.', 'investigating'),
  ('b0000000-0000-4000-8000-000000001308', 'c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000005', '2026-09-12 11:04+00', 'high', 'collision', 'Low-speed rear-end. Van OOS pending body work.', 'open'),
  ('b0000000-0000-4000-8000-000000001238', 'c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', '2026-09-08 09:40+00', 'low', 'cargo', 'Package crush at overflow tote.', 'closed');

insert into public.coaching_recommendations (driver_id, category, priority, recommendation, metric, created_at) values
  ('b0000000-0000-4000-8000-000000001156', 'Safety', 'high', 'Complete speeding clinic and dual-ride with a safety mentor.', '3 speeding events / 7d', '2026-09-19 08:00+00'),
  ('b0000000-0000-4000-8000-000000001238', 'Pacing', 'high', 'Wave-time discipline and stop sequencing.', 'On-time 92.4%', '2026-09-20 06:30+00'),
  ('b0000000-0000-4000-8000-000000001308', 'Attendance', 'high', 'Attendance counseling and reliability PIP checkpoint.', 'Attendance 91.6%', '2026-09-17 09:00+00');

insert into public.financial_daily (station_id, service_date, revenue, labor_cost, overtime_cost, fuel_cost, vehicle_cost, other_cost)
select
  s.id,
  d::date,
  round((base.amt * weekend * (0.97 + (abs(hashtext(s.code || d::text)) % 600) / 10000.0))::numeric, 2),
  round((base.amt * 0.52)::numeric, 2),
  round((base.amt * 0.055)::numeric, 2),
  round((base.amt * 0.10)::numeric, 2),
  round((base.amt * 0.08)::numeric, 2),
  round((base.amt * 0.03)::numeric, 2)
from public.stations s
join (values
  ('DLA7', 92000),
  ('DAX5', 74000),
  ('DSE2', 69000),
  ('DAT6', 62000),
  ('DCH1', 63000)
) as base(code, amt) on base.code = s.code
cross join generate_series('2026-07-23'::date, '2026-09-20'::date, interval '1 day') as d
cross join lateral (
  select case extract(dow from d) when 6 then 1.12 when 0 then 1.06 else 1 end as weekend
) w;

insert into public.scorecards (
  station_id, week_start, standing, dcr, cdf, pod_compliance, contact_compliance, safety_score, attendance_pct, photo_on_delivery
)
select
  s.id,
  week,
  case when dcr >= 99 then 'fantastic' when dcr >= 98.2 then 'great' when dcr >= 97 then 'fair' else 'poor' end::score_standing,
  dcr,
  4.80,
  98.2,
  97.6,
  860,
  97.8,
  98.0
from public.stations s
cross join generate_series('2026-07-27'::date, '2026-09-14'::date, interval '7 day') as week
cross join lateral (
  select round((98.4 + (abs(hashtext(s.code || week::text)) % 120) / 100.0)::numeric, 2) as dcr
) m;

insert into public.forecasts (
  station_id, forecast_date, volume_forecast, volume_lower, volume_upper, volume_actual,
  routes_forecast, staffing_forecast, overtime_hours_forecast
)
select
  s.id,
  d::date,
  vol,
  round(vol * 0.94),
  round(vol * 1.07),
  case when d::date <= '2026-09-20' then round(vol * 1.01) else null end,
  28,
  31,
  24.5
from public.stations s
join (values
  ('DLA7', 4820),
  ('DAX5', 3910),
  ('DSE2', 3640),
  ('DAT6', 3270),
  ('DCH1', 3302)
) as base(code, amt) on base.code = s.code
cross join generate_series('2026-09-14'::date, '2026-09-27'::date, interval '1 day') as d
cross join lateral (
  select round(base.amt * case extract(dow from d) when 6 then 1.14 when 0 then 1.05 else 1 end) as vol
) v;

insert into public.route_hourly_stats (service_date, hour_label, planned, delivered) values
  ('2026-09-20', '06:00', 900, 880),
  ('2026-09-20', '08:00', 3200, 3120),
  ('2026-09-20', '10:00', 6400, 6250),
  ('2026-09-20', '12:00', 9600, 9410),
  ('2026-09-20', '14:00', 12800, 12610),
  ('2026-09-20', '16:00', 15600, 15380),
  ('2026-09-20', '18:00', 17900, 17640);

commit;
