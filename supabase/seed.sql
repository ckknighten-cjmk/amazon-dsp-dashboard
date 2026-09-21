-- Mock seed for Amazon DSP Operations Command Center
-- Run after schema.sql. Safe to re-run: deletes DSP operational rows first.

begin;

delete from public.import_jobs;
delete from public.training_records;
delete from public.interviews;
delete from public.recruiting;
delete from public.repair_costs;
delete from public.maintenance_events;
delete from public.vehicle_status_history;
delete from public.work_orders;
delete from public.vehicle_downtime;
delete from public.disciplinary_records;
delete from public.pto_requests;
delete from public.expenses;
delete from public.payroll;
delete from public.maintenance_orders;
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
  ('b0000000-0000-4000-8000-000000001308', 'DRV-1308', 'Pablo Romero', 'a0000000-0000-4000-8000-000000000005', '2024-03-03', 'off_duty', 748, 711, 96.8, 91.6, 90.8, 1340, 95.1),
  ('b0000000-0000-4000-8000-000000001322', 'DRV-1322', 'Priya Desai', 'a0000000-0000-4000-8000-000000000001', '2026-09-08', 'off_duty', 800, 810, 98.0, 100, 96.0, 420, 99.2),
  ('b0000000-0000-4000-8000-000000001336', 'DRV-1336', 'Marcus Webb', 'a0000000-0000-4000-8000-000000000003', '2026-09-15', 'off_duty', 790, 798, 97.6, 100, 95.4, 510, 98.8),
  ('b0000000-0000-4000-8000-000000001350', 'DRV-1350', 'Elena Rossi', 'a0000000-0000-4000-8000-000000000004', '2023-05-01', 'off_duty', 834, 848, 98.6, 97.2, 96.9, 360, 99.0);

update public.drivers set employment_status = 'active';
update public.drivers set employment_status = 'offboarding' where employee_code = 'DRV-1308';
update public.drivers set employment_status = 'onboarding' where employee_code in ('DRV-1322', 'DRV-1336');
update public.drivers set employment_status = 'terminated', termination_date = '2026-09-12' where employee_code = 'DRV-1350';

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

update public.vehicles v
set
  powertrain = 'ev',
  odometer_miles = 14850 + (row_number * 3720),
  last_service_date = date '2026-09-20' - (12 + row_number),
  next_service_miles = 20000 + (row_number * 5000),
  utilization_pct = case when v.status = 'maintenance' then 18 else 76 end,
  assigned_driver_id = d.id
from (
  select id, row_number() over (order by van_id) as row_number
  from public.vehicles
) numbered
join public.drivers d on d.employee_code = ('DRV-' || (array[
  '1042','1088','1103','1156','1177','1201','1210','1224','1238','1252','1266','1280','1294','1308'
])[numbered.row_number])
where v.id = numbered.id;

insert into public.vehicles (id, van_id, vin, station_id, year, make, model, status, powertrain, odometer_miles, last_service_date, next_service_miles, utilization_pct)
values (
  'c0000000-0000-4000-8000-000000000015', 'EV-224', '1FTBW3U60PKA10015',
  'a0000000-0000-4000-8000-000000000001', 2023, 'Ford', 'E-Transit', 'oos', 'ev', 41220, '2026-09-18', 45000, 0
);

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
  ('d0000000-0000-4000-8000-000000000021', 'CX-21', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000001294', 'c0000000-0000-4000-8000-000000000013', '2026-09-20', 'in_progress', 188, 157, 1220, 1014, 1, '2026-09-20 07:04+00', null, '2026-09-20 18:25+00'),
  ('d0000000-0000-4000-8000-000000000040', 'CX-40', 'a0000000-0000-4000-8000-000000000001', null, null, '2026-09-20', 'planned', 176, 0, 1150, 0, 0, null, null, '2026-09-20 18:30+00'),
  ('d0000000-0000-4000-8000-000000000041', 'CX-41', 'a0000000-0000-4000-8000-000000000002', null, null, '2026-09-20', 'planned', 162, 0, 1048, 0, 0, null, null, '2026-09-20 18:45+00'),
  ('d0000000-0000-4000-8000-000000000042', 'CX-42', 'a0000000-0000-4000-8000-000000000005', null, null, '2026-09-20', 'planned', 170, 0, 1102, 0, 0, null, null, '2026-09-20 18:55+00');

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
cross join generate_series('2026-09-14'::date, '2026-09-20'::date, interval '1 day') day
where d.employment_status <> 'terminated';

update public.attendance
set status = 'no_show', actual_start = null
where driver_id = 'b0000000-0000-4000-8000-000000001308'
  and service_date in ('2026-09-18', '2026-09-20');

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
  station_id, week_start, standing, dcr, cdf, pod_compliance, contact_compliance, safety_score, attendance_pct, photo_on_delivery, dnr, dsc, customer_escalations, fico_score
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
  98.0,
  0.22,
  99.3,
  7,
  845
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

insert into public.maintenance_orders (
  vehicle_id, station_id, work_order, type, status, scheduled_date, completed_date, odometer_miles, vendor, cost, downtime_hours, description
) values
  ('c0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000001', 'WO-4418', 'body', 'in_progress', '2026-09-18', null, 41220, 'Penske Collision DLA7', 4180, 46, 'Rear quarter panel after cul-de-sac contact'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000005', 'WO-4421', 'corrective', 'in_progress', '2026-09-20', null, 62000, 'Amazon Fleet Shop DCH1', 890, 9, 'Brake warning + inner rear tire wear from DVIC fail'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'WO-4390', 'preventive', 'scheduled', '2026-09-22', null, 28000, 'Amazon Fleet Shop DAX5', 340, 4, '5k PM'),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'WO-4382', 'tire', 'overdue', '2026-09-19', null, 42000, 'Discount Tire SODO', 620, 3, 'Inner rear replacement after pre-trip flag'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'WO-4311', 'preventive', 'completed', '2026-09-08', '2026-09-08', 14850, 'Amazon Fleet Shop DLA7', 285, 2.5, 'Completed 15k PM'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'WO-4334', 'recall', 'completed', '2026-09-12', '2026-09-12', 37170, 'Ford Commercial Seattle', 0, 5, 'Camera module recall — warranty'),
  ('c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000005', 'WO-4360', 'corrective', 'completed', '2026-09-15', '2026-09-15', 55770, 'Amazon Fleet Shop DCH1', 475, 6, '12V aux battery replacement'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'WO-4428', 'preventive', 'scheduled', '2026-09-25', null, 22000, 'Amazon Fleet Shop DLA7', 310, 3, 'Upcoming 20k PM');

insert into public.vehicle_downtime (vehicle_id, station_id, started_at, ended_at, reason, hours, notes) values
  ('c0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000001', '2026-09-18 07:00+00', null, 'accident', 46, 'OOS pending body shop — EV-224'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000005', '2026-09-20 06:20+00', null, 'inspection_fail', 9, 'Held after DVIC fail — brake warning'),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', '2026-09-19 16:40+00', '2026-09-20 05:50+00', 'parts', 13, 'Waiting on tire set overnight'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-09-08 06:00+00', '2026-09-08 08:30+00', 'maintenance', 2.5, 'PM completed same morning'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', '2026-09-17 18:10+00', '2026-09-17 20:05+00', 'charging', 1.9, 'Returned below reserve SOC');

insert into public.work_orders (
  id, vehicle_id, station_id, wo_number, title, description, type, status, priority,
  opened_at, due_at, completed_at, shop, estimated_hours, actual_hours
) values
  ('e1000000-0000-4000-8000-000000004418', 'c0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000001', 'WO-4418', 'Body shop — rear quarter panel', 'Rear quarter panel and sensor cluster after cul-de-sac contact.', 'body', 'in_progress', 'critical', '2026-09-18', '2026-09-23', null, 'Penske Collision DLA7', 48, 46),
  ('e1000000-0000-4000-8000-000000004421', 'c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000005', 'WO-4421', 'Brake warning + inner rear tire', 'DVIC fail: brake warning light and inner rear tire wear.', 'repair', 'in_progress', 'critical', '2026-09-20', '2026-09-20', null, 'Amazon Fleet Shop DCH1', 10, 9),
  ('e1000000-0000-4000-8000-000000004382', 'c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'WO-4382', 'Overdue inner rear tire', 'Pre-trip headlamp and inner rear wear. Tire set staged overnight.', 'tire', 'open', 'high', '2026-09-19', '2026-09-19', null, 'Discount Tire SODO', 3, null),
  ('e1000000-0000-4000-8000-000000004430', 'c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'WO-4430', 'Open DVIC — headlamp out', 'Left headlamp failed pre-trip. Blocks tomorrow launch.', 'dvic', 'open', 'high', '2026-09-20', '2026-09-20', null, 'Amazon Fleet Shop DSE2', 1.5, null),
  ('e1000000-0000-4000-8000-000000004390', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'WO-4390', '5k preventive maintenance', 'Cabin filter, torque, and software recall check.', 'preventive', 'open', 'medium', '2026-09-17', '2026-09-22', null, 'Amazon Fleet Shop DAX5', 4, null),
  ('e1000000-0000-4000-8000-000000004428', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'WO-4428', 'Upcoming 20k PM', 'Scheduled 20k preventive service. Van remains available tomorrow.', 'preventive', 'open', 'low', '2026-09-19', '2026-09-25', null, 'Amazon Fleet Shop DLA7', 3, null),
  ('e1000000-0000-4000-8000-000000004311', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'WO-4311', 'Completed 15k PM', '15k PM closed same morning.', 'preventive', 'completed', 'medium', '2026-09-06', '2026-09-08', '2026-09-08', 'Amazon Fleet Shop DLA7', 3, 2.5),
  ('e1000000-0000-4000-8000-000000004334', 'c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'WO-4334', 'Camera module recall', 'Ford commercial camera module recall — warranty.', 'recall', 'completed', 'medium', '2026-09-10', '2026-09-12', '2026-09-12', 'Ford Commercial Seattle', 5, 5),
  ('e1000000-0000-4000-8000-000000004360', 'c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000005', 'WO-4360', '12V aux battery replacement', 'No-start after overnight sit.', 'repair', 'completed', 'high', '2026-09-14', '2026-09-15', '2026-09-15', 'Amazon Fleet Shop DCH1', 6, 6),
  ('e1000000-0000-4000-8000-000000004298', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'WO-4298', 'Passenger mirror assembly', 'HOA gate-arm contact. Mirror housing and glass replaced.', 'body', 'completed', 'medium', '2026-09-17', '2026-09-18', '2026-09-18', 'Penske Collision DAX5', 6, 5.5);

insert into public.maintenance_events (
  vehicle_id, station_id, work_order_id, event_type, occurred_at, odometer_miles, title, description, downtime_hours, technician
) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000004311', 'preventive', '2026-09-08 08:10+00', 14850, '15k PM completed', 'Filter, torque, and software cadence closed same morning.', 2.5, 'Shop lead DLA7'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000004334', 'repair', '2026-09-12 11:40+00', 37170, 'Camera recall closed', 'Warranty camera module swap and aim calibration.', 5, 'Ford Commercial Seattle'),
  ('c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000004360', 'repair', '2026-09-15 09:20+00', 55770, 'Aux battery replaced', '12V aux battery and load test after no-start.', 6, 'Shop lead DCH1'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000004298', 'damage', '2026-09-18 15:40+00', 28000, 'New damage — passenger mirror', 'HOA gate-arm contact. Mirror assembly replaced.', 5.5, 'Penske Collision DAX5'),
  ('c0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000004418', 'damage', '2026-09-18 11:10+00', 41220, 'New damage — rear quarter panel', 'Low-speed cul-de-sac contact. Van OOS pending body work.', 46, 'Penske Collision DLA7'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000004421', 'dvic', '2026-09-20 06:24+00', 62000, 'DVIC fail — brake warning', 'Pre-trip fail: brake warning light and inner rear tire wear.', 9, 'Wave inspector DCH1'),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000004430', 'dvic', '2026-09-20 06:18+00', 42000, 'Open DVIC — headlamp out', 'Left headlamp out on pre-trip. Not cleared for tomorrow.', 0, 'Wave inspector DSE2'),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000004382', 'repair', '2026-09-19 16:50+00', 42000, 'Tire wear flagged at return', 'Inner rear wear beyond spec. Tire set staged overnight.', 13, 'Discount Tire SODO'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000004428', 'inspection', '2026-09-20 06:12+00', 22000, 'Pre-trip pass', 'DVIC pass. 20k PM remains scheduled later this week.', 0, 'Wave inspector DLA7'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', null, 'inspection', '2026-09-20 06:10+00', 14850, 'Pre-trip pass', 'Cleared for wave. No open defects.', 0, 'Wave inspector DLA7');

insert into public.vehicle_status_history (vehicle_id, from_status, to_status, changed_at, reason, changed_by) values
  ('c0000000-0000-4000-8000-000000000015', 'active', 'oos', '2026-09-18 11:20+00', 'Cul-de-sac contact — grounded pending body shop', 'Riley Cho'),
  ('c0000000-0000-4000-8000-000000000014', 'active', 'maintenance', '2026-09-20 06:28+00', 'DVIC fail — brake warning / tire wear', 'Jordan Hale'),
  ('c0000000-0000-4000-8000-000000000009', 'active', 'maintenance', '2026-09-19 16:45+00', 'Held overnight for tire set', 'Sam Okonkwo'),
  ('c0000000-0000-4000-8000-000000000009', 'maintenance', 'active', '2026-09-20 05:50+00', 'Returned to yard; DVIC headlamp still open', 'Sam Okonkwo'),
  ('c0000000-0000-4000-8000-000000000004', 'maintenance', 'active', '2026-09-18 20:10+00', 'Mirror assembly replaced; released for service', 'Jordan Hale'),
  ('c0000000-0000-4000-8000-000000000004', 'active', 'maintenance', '2026-09-17 16:00+00', 'Gate-arm damage — shop overnight', 'Riley Cho'),
  ('c0000000-0000-4000-8000-000000000001', 'maintenance', 'active', '2026-09-08 08:35+00', '15k PM complete', 'Shop lead DLA7'),
  ('c0000000-0000-4000-8000-000000000012', 'maintenance', 'active', '2026-09-15 12:05+00', 'Aux battery replaced', 'Shop lead DCH1');

insert into public.repair_costs (vehicle_id, work_order_id, category, amount, incurred_at, vendor, description) values
  ('c0000000-0000-4000-8000-000000000015', 'e1000000-0000-4000-8000-000000004418', 'body', 2180, '2026-09-19', 'Penske Collision DLA7', 'Quarter panel and blend'),
  ('c0000000-0000-4000-8000-000000000015', 'e1000000-0000-4000-8000-000000004418', 'parts', 1260, '2026-09-19', 'Penske Collision DLA7', 'Sensor cluster + clips'),
  ('c0000000-0000-4000-8000-000000000015', 'e1000000-0000-4000-8000-000000004418', 'labor', 740, '2026-09-20', 'Penske Collision DLA7', 'Body labor in progress'),
  ('c0000000-0000-4000-8000-000000000014', 'e1000000-0000-4000-8000-000000004421', 'parts', 420, '2026-09-20', 'Amazon Fleet Shop DCH1', 'Brake sensor + hardware'),
  ('c0000000-0000-4000-8000-000000000014', 'e1000000-0000-4000-8000-000000004421', 'labor', 470, '2026-09-20', 'Amazon Fleet Shop DCH1', 'Diagnosis and tire inspect'),
  ('c0000000-0000-4000-8000-000000000009', 'e1000000-0000-4000-8000-000000004382', 'tires', 620, '2026-09-20', 'Discount Tire SODO', 'Inner rear tire set'),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000004311', 'labor', 185, '2026-09-08', 'Amazon Fleet Shop DLA7', '15k PM labor'),
  ('c0000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000004311', 'parts', 100, '2026-09-08', 'Amazon Fleet Shop DLA7', 'Cabin filter kit'),
  ('c0000000-0000-4000-8000-000000000012', 'e1000000-0000-4000-8000-000000004360', 'parts', 310, '2026-09-15', 'Amazon Fleet Shop DCH1', '12V aux battery'),
  ('c0000000-0000-4000-8000-000000000012', 'e1000000-0000-4000-8000-000000004360', 'labor', 165, '2026-09-15', 'Amazon Fleet Shop DCH1', 'Battery R&R / load test'),
  ('c0000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000004298', 'glass', 240, '2026-09-18', 'Penske Collision DAX5', 'Mirror glass'),
  ('c0000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000004298', 'body', 410, '2026-09-18', 'Penske Collision DAX5', 'Housing and paint blend'),
  ('c0000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000004298', 'labor', 240, '2026-09-18', 'Penske Collision DAX5', 'Mirror R&R'),
  ('c0000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000004428', 'parts', 95, '2026-09-20', 'Amazon Fleet Shop DLA7', 'PM kit staged');

insert into public.pto_requests (driver_id, pto_type, status, start_date, end_date, hours, notes) values
  ('b0000000-0000-4000-8000-000000001266', 'vacation', 'taken', '2026-09-14', '2026-09-15', 18, 'Approved vacation — back mid-week'),
  ('b0000000-0000-4000-8000-000000001266', 'personal', 'approved', '2026-09-20', '2026-09-20', 9, 'Sunday personal day'),
  ('b0000000-0000-4000-8000-000000001308', 'unpaid', 'pending', '2026-09-21', '2026-09-23', 27, 'Reliability hold — pending ops review'),
  ('b0000000-0000-4000-8000-000000001201', 'sick', 'taken', '2026-09-15', '2026-09-15', 9, 'Call-out converted to sick'),
  ('b0000000-0000-4000-8000-000000001103', 'vacation', 'approved', '2026-09-26', '2026-09-28', 27, 'Peak-adjacent PTO — coverage assigned'),
  ('b0000000-0000-4000-8000-000000001042', 'personal', 'denied', '2026-09-26', '2026-09-26', 9, 'Saturday peak — denied'),
  ('b0000000-0000-4000-8000-000000001210', 'vacation', 'approved', '2026-09-24', '2026-09-25', 18, 'Mid-week vacation — extra DA covering DSE2'),
  ('b0000000-0000-4000-8000-000000001224', 'personal', 'pending', '2026-09-22', '2026-09-22', 9, 'School appointment'),
  ('b0000000-0000-4000-8000-000000001294', 'sick', 'taken', '2026-09-16', '2026-09-16', 9, 'Same-day sick'),
  ('b0000000-0000-4000-8000-000000001280', 'vacation', 'approved', '2026-09-28', '2026-09-30', 27, 'Blackout adjacent'),
  ('b0000000-0000-4000-8000-000000001252', 'personal', 'approved', '2026-09-21', '2026-09-21', 9, 'Monday personal'),
  ('b0000000-0000-4000-8000-000000001177', 'sick', 'pending', '2026-09-23', '2026-09-23', 9, 'Follow-up appointment');

insert into public.disciplinary_records (driver_id, occurred_at, type, status, category, description, issued_by) values
  ('b0000000-0000-4000-8000-000000001308', '2026-09-14 10:30+00', 'final', 'open', 'Safety', 'Seatbelt + distraction after prior written warning.', 'Riley Cho'),
  ('b0000000-0000-4000-8000-000000001156', '2026-09-18 16:00+00', 'written', 'open', 'Safety', 'Third speeding event in seven days.', 'Riley Cho'),
  ('b0000000-0000-4000-8000-000000001238', '2026-09-19 07:15+00', 'verbal', 'open', 'Performance', 'Late wave + rescue dependency.', 'Jordan Hale'),
  ('b0000000-0000-4000-8000-000000001201', '2026-09-10 09:00+00', 'verbal', 'closed', 'Attendance', 'Call-out pattern counseling.', 'Jordan Hale');

insert into public.payroll (
  driver_id, station_id, period_start, period_end, regular_hours, overtime_hours, regular_pay, overtime_pay, bonuses, deductions, net_pay
)
select
  d.id,
  d.station_id,
  '2026-08-31'::date,
  '2026-09-13'::date,
  40,
  case when d.attendance_pct < 95 then 7.5 else 2.4 end,
  870,
  case when d.attendance_pct < 95 then 244.73 else 78.31 end,
  case when d.dcr >= 99.3 then 75 else 0 end,
  24,
  870 + (case when d.attendance_pct < 95 then 244.73 else 78.31 end) + (case when d.dcr >= 99.3 then 75 else 0 end) - 24
from public.drivers d;

insert into public.payroll (
  driver_id, station_id, period_start, period_end, regular_hours, overtime_hours, regular_pay, overtime_pay, bonuses, deductions, net_pay
)
select
  d.id,
  d.station_id,
  '2026-09-14'::date,
  '2026-09-20'::date,
  27,
  case when d.employee_code in ('DRV-1156', 'DRV-1238') then 5.2 else 1.6 end,
  587.25,
  case when d.employee_code in ('DRV-1156', 'DRV-1238') then 169.68 else 52.21 end,
  0,
  20,
  587.25 + (case when d.employee_code in ('DRV-1156', 'DRV-1238') then 169.68 else 52.21 end) - 20
from public.drivers d;

insert into public.expenses (station_id, service_date, category, vendor, amount, source, reference, notes)
select
  s.id,
  d::date,
  'fuel',
  'WEX Connect',
  round((base.amt * case extract(dow from d) when 6 then 1.14 when 0 then 1.06 else 1 end)::numeric, 2),
  'fuel_card',
  'WEX-' || to_char(d, 'YYYYMMDD') || '-' || s.code,
  'Depot charge + mid-day top-up'
from public.stations s
join (values
  ('DLA7', 1840),
  ('DAX5', 1520),
  ('DSE2', 1410),
  ('DAT6', 1280),
  ('DCH1', 1310)
) as base(code, amt) on base.code = s.code
cross join generate_series('2026-09-07'::date, '2026-09-20'::date, interval '1 day') as d;

insert into public.expenses (station_id, service_date, category, vendor, amount, source, reference, notes)
select station_id, coalesce(completed_date, scheduled_date), 'maintenance', vendor, cost, 'shop', work_order, description
from public.maintenance_orders
where cost > 0;

insert into public.expenses (station_id, service_date, category, vendor, amount, source, reference, notes) values
  ('a0000000-0000-4000-8000-000000000001', '2026-09-11', 'insurance', 'Progressive Commercial', 6420, 'manual', 'INV-PC-9921', 'Monthly fleet liability installment'),
  ('a0000000-0000-4000-8000-000000000002', '2026-09-16', 'supplies', 'Uline', 318, 'manual', 'PO-8841', 'Tote labels and overflow bags'),
  ('a0000000-0000-4000-8000-000000000003', '2026-09-14', 'uniforms', 'Amazon DSP Gear', 246, 'manual', 'UNI-2209', 'Replacement vest + rain kit');

insert into public.import_jobs (source, status, last_run_at, next_run_at, records_imported, records_failed, mapping_notes, connector) values
  ('amazon_scorecard', 'mapped', '2026-09-15 04:10+00', '2026-09-22 04:00+00', 40, 0, 'Weekly Amazon scorecard CSV → DCR, POD, CDF, Safety, FICO, DNR, DSC, CE', 'S3 / Partner Portal export'),
  ('payroll', 'imported', '2026-09-13 22:15+00', '2026-09-26 22:00+00', 14, 0, 'ADP / Paycom hours, OT, bonuses, and net pay by employee code', 'SFTP payroll register'),
  ('fuel_card', 'imported', '2026-09-19 03:40+00', '2026-09-21 03:40+00', 70, 2, 'WEX / charge-network transactions → expenses.fuel', 'WEX Connect API'),
  ('fleet_maintenance', 'ready', '2026-09-17 01:20+00', '2026-09-20 23:30+00', 0, 0, 'Shop work orders, DVIC defects, and downtime from fleet vendor', 'Amazon Fleet / shop CSV');

insert into public.recruiting (
  id, station_id, driver_id, full_name, email, phone, source, role, stage, status, applied_at, recruiter, notes
) values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', null, 'Jordan Blake', 'jordan.blake@mail.local', '323-555-0142', 'Indeed', 'driver_associate', 'applied', 'open', '2026-09-17', 'Jordan Hale', 'Evening availability'),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', null, 'Camila Ortiz', 'camila.ortiz@mail.local', '602-555-0194', 'Referral', 'driver_associate', 'phone_screen', 'open', '2026-09-12', 'Jordan Hale', 'Referred by David Okafor'),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', null, 'Andre Walsh', 'andre.walsh@mail.local', '206-555-0177', 'Career fair', 'driver_associate', 'interview', 'open', '2026-09-08', 'Sam Okonkwo', 'Ops interview scheduled'),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000001322', 'Priya Desai', 'priya.desai@mail.local', '310-555-0118', 'Indeed', 'driver_associate', 'hired', 'hired', '2026-08-23', 'Jordan Hale', 'Started 8 Sep'),
  ('e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000001336', 'Marcus Webb', 'marcus.webb@mail.local', '425-555-0160', 'Amazon jobs', 'driver_associate', 'hired', 'hired', '2026-08-30', 'Sam Okonkwo', 'Day-5 of onboarding'),
  ('e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000004', null, 'Naomi Okada', 'naomi.okada@mail.local', '404-555-0133', 'LinkedIn', 'driver_associate', 'offer', 'open', '2026-09-04', 'Jordan Hale', 'Verbal offer out'),
  ('e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000005', null, 'Luis Ferreira', 'luis.ferreira@mail.local', '312-555-0188', 'Indeed', 'driver_associate', 'ride_along', 'open', '2026-09-10', 'Riley Cho', 'Ride-along tomorrow'),
  ('e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', null, 'Hannah Cole', 'hannah.cole@mail.local', '213-555-0104', 'Indeed', 'driver_associate', 'rejected', 'rejected', '2026-09-02', 'Jordan Hale', 'Failed MVR'),
  ('e0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000002', null, 'Kenji Sato', 'kenji.sato@mail.local', '480-555-0129', 'Referral', 'driver_associate', 'withdrawn', 'withdrawn', '2026-09-06', 'Jordan Hale', 'Accepted a Flex offer'),
  ('e0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000001', null, 'Aisha Rahman', 'aisha.rahman@mail.local', '562-555-0155', 'Amazon jobs', 'driver_associate', 'interview', 'open', '2026-09-14', 'Jordan Hale', 'Ops interview this week'),
  ('e0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000005', null, 'Ben Travers', 'ben.travers@mail.local', '773-555-0171', 'Indeed', 'driver_associate', 'applied', 'open', '2026-09-19', 'Sam Okonkwo', 'Weekend availability'),
  ('e0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000001350', 'Elena Rossi', 'elena.rossi@mail.local', '678-555-0140', 'Referral', 'driver_associate', 'hired', 'hired', '2023-04-12', 'Jordan Hale', 'Separated 12 Sep');

insert into public.interviews (id, recruiting_id, stage, scheduled_at, interviewer, result, score, notes) values
  ('e1000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', 'phone_screen', '2026-09-21 16:00+00', 'Jordan Hale', 'scheduled', null, 'Availability screen'),
  ('e1000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000003', 'phone_screen', '2026-09-13 17:30+00', 'Sam Okonkwo', 'passed', 4.2, 'Advance to ops'),
  ('e1000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000003', 'ops_interview', '2026-09-21 14:00+00', 'Riley Cho', 'scheduled', null, 'Safety scenario'),
  ('e1000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000004', 'ops_interview', '2026-08-29 13:30+00', 'Alex Rivera', 'passed', 4.4, 'Hired'),
  ('e1000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000005', 'ride_along', '2026-09-04 07:00+00', 'Ravi Singh', 'passed', 4.0, 'Comfortable in van'),
  ('e1000000-0000-4000-8000-000000000006', 'e0000000-0000-4000-8000-000000000006', 'offer_review', '2026-09-22 18:00+00', 'Alex Rivera', 'scheduled', null, 'Verbal offer follow-up'),
  ('e1000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000007', 'ride_along', '2026-09-21 07:10+00', 'Chris Nguyen', 'scheduled', null, 'Shadow CX-21'),
  ('e1000000-0000-4000-8000-000000000008', 'e0000000-0000-4000-8000-000000000008', 'background', '2026-09-05 10:00+00', 'Sterling', 'failed', 1.0, 'MVR fail'),
  ('e1000000-0000-4000-8000-000000000009', 'e0000000-0000-4000-8000-000000000010', 'ops_interview', '2026-09-22 15:30+00', 'Riley Cho', 'scheduled', null, 'Safety scenario');

insert into public.training_records (
  driver_id, recruiting_id, course, category, status, started_at, completed_at, due_date, score, required
) values
  ('b0000000-0000-4000-8000-000000001322', 'e0000000-0000-4000-8000-000000000004', 'DSP New Hire Orientation', 'onboarding', 'completed', '2026-09-08', '2026-09-09', '2026-09-30', 94, true),
  ('b0000000-0000-4000-8000-000000001322', 'e0000000-0000-4000-8000-000000000004', 'Mentor / FICO', 'onboarding', 'completed', '2026-09-09', '2026-09-10', '2026-09-30', 92, true),
  ('b0000000-0000-4000-8000-000000001322', 'e0000000-0000-4000-8000-000000000004', 'DVIC / Pre-trip', 'onboarding', 'completed', '2026-09-10', '2026-09-11', '2026-09-30', 91, true),
  ('b0000000-0000-4000-8000-000000001322', 'e0000000-0000-4000-8000-000000000004', 'Nursery Route', 'onboarding', 'completed', '2026-09-11', '2026-09-12', '2026-09-30', 90, true),
  ('b0000000-0000-4000-8000-000000001322', 'e0000000-0000-4000-8000-000000000004', 'Drug Screen & Background', 'onboarding', 'in_progress', '2026-09-12', null, '2026-09-25', null, true),
  ('b0000000-0000-4000-8000-000000001322', 'e0000000-0000-4000-8000-000000000004', 'Uniform & Badge', 'onboarding', 'not_started', null, null, '2026-09-30', null, true),
  ('b0000000-0000-4000-8000-000000001336', 'e0000000-0000-4000-8000-000000000005', 'DSP New Hire Orientation', 'onboarding', 'completed', '2026-09-15', '2026-09-16', '2026-09-30', 90, true),
  ('b0000000-0000-4000-8000-000000001336', 'e0000000-0000-4000-8000-000000000005', 'Mentor / FICO', 'onboarding', 'completed', '2026-09-16', '2026-09-17', '2026-09-30', 88, true),
  ('b0000000-0000-4000-8000-000000001336', 'e0000000-0000-4000-8000-000000000005', 'DVIC / Pre-trip', 'onboarding', 'in_progress', '2026-09-17', null, '2026-09-25', null, true),
  ('b0000000-0000-4000-8000-000000001336', 'e0000000-0000-4000-8000-000000000005', 'Nursery Route', 'onboarding', 'not_started', null, null, '2026-09-30', null, true),
  ('b0000000-0000-4000-8000-000000001308', null, 'Badge & fob return', 'offboarding', 'not_started', null, null, '2026-09-23', null, true),
  ('b0000000-0000-4000-8000-000000001308', null, 'Van turn-in / DVIC', 'offboarding', 'in_progress', '2026-09-18', null, '2026-09-23', null, true),
  ('b0000000-0000-4000-8000-000000001308', null, 'Exit interview', 'offboarding', 'not_started', null, null, '2026-09-23', null, true),
  ('b0000000-0000-4000-8000-000000001350', 'e0000000-0000-4000-8000-000000000012', 'Badge & fob return', 'offboarding', 'completed', '2026-09-10', '2026-09-11', '2026-09-12', null, true),
  ('b0000000-0000-4000-8000-000000001350', 'e0000000-0000-4000-8000-000000000012', 'Final pay / ADP', 'offboarding', 'completed', '2026-09-11', '2026-09-12', '2026-09-12', null, true),
  ('b0000000-0000-4000-8000-000000001156', null, 'Annual Safety Refresh', 'safety', 'overdue', '2026-08-11', null, '2026-09-16', null, true),
  ('b0000000-0000-4000-8000-000000001238', null, 'Distracted Driving', 'safety', 'overdue', '2026-08-31', null, '2026-09-19', null, true),
  ('b0000000-0000-4000-8000-000000001042', null, 'Heat Illness', 'compliance', 'completed', '2026-08-21', '2026-08-23', '2026-11-19', 98, true);

commit;
