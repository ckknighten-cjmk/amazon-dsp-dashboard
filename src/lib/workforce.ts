import { TODAY, TOMORROW, WEEK_START, MONTH_START } from "../data/seed";
import type {
  AttendanceStatus,
  EmploymentStatus,
  Interview,
  Kpi,
  RecruitingStage,
  SeedDatabase,
  TrainingRecord,
} from "../types/database";
import { addDays, dateRange, formatNumber, formatPct, sum, weekdayShort } from "./format";

const EXCEPTION_STATUSES: AttendanceStatus[] = ["late", "call_out", "absent", "no_show"];
const OUT_STATUSES: AttendanceStatus[] = ["call_out", "absent", "no_show", "pto"];

function stationCode(db: SeedDatabase, stationId: string): string {
  return db.stations.find((station) => station.id === stationId)?.code ?? "";
}

function driverName(db: SeedDatabase, driverId: string | null): string {
  if (!driverId) return "Unassigned";
  return db.drivers.find((driver) => driver.id === driverId)?.full_name ?? driverId;
}

export function rosterDrivers(db: SeedDatabase) {
  return db.drivers.filter(
    (driver) => driver.employment_status === "active" || driver.employment_status === "offboarding",
  );
}

function coveringPto(db: SeedDatabase, date: string) {
  return db.pto.filter(
    (row) => (row.status === "approved" || row.status === "taken") && row.start_date <= date && row.end_date >= date,
  );
}

function outDriverIds(db: SeedDatabase, date: string): Set<string> {
  const ids = new Set(coveringPto(db, date).map((row) => row.driver_id));
  db.attendance
    .filter((row) => row.service_date === date && OUT_STATUSES.includes(row.status))
    .forEach((row) => ids.add(row.driver_id));
  return ids;
}

function countStatus(rows: SeedDatabase["attendance"], status: AttendanceStatus): number {
  return rows.filter((row) => row.status === status).length;
}

export function buildAttendanceDashboard(db: SeedDatabase) {
  const roster = rosterDrivers(db);
  const todayRows = db.attendance.filter((row) => row.service_date === TODAY);
  const weekRows = db.attendance.filter((row) => row.service_date >= WEEK_START && row.service_date <= TODAY);
  const weekDates = dateRange(WEEK_START, TODAY);

  const present = countStatus(todayRows, "present");
  const late = countStatus(todayRows, "late");
  const callOuts = countStatus(todayRows, "call_out");
  const noShows = countStatus(todayRows, "no_show");
  const absent = countStatus(todayRows, "absent");
  const pto = countStatus(todayRows, "pto");
  const reliability = todayRows.length ? ((present + late) / todayRows.length) * 100 : 0;
  const weekReliability =
    weekRows.length === 0
      ? 0
      : ((countStatus(weekRows, "present") + countStatus(weekRows, "late")) / weekRows.length) * 100;

  const kpis: Kpi[] = [
    {
      label: "On the board",
      value: String(present + late),
      delta: `${late} late`,
      trend: reliability >= 95 ? "up" : "down",
      hint: "Present + late today",
      favorable: "up",
    },
    {
      label: "Call-outs",
      value: String(callOuts),
      delta: `${countStatus(weekRows, "call_out")} this week`,
      trend: callOuts > 0 ? "down" : "up",
      hint: "Notified absences today",
      favorable: "down",
    },
    {
      label: "No-shows",
      value: String(noShows),
      delta: `${countStatus(weekRows, "no_show")} this week`,
      trend: noShows > 0 ? "down" : "up",
      hint: "Unnotified misses",
      favorable: "down",
    },
    {
      label: "Reliability",
      value: formatPct(reliability),
      delta: `${formatPct(weekReliability)} week`,
      trend: reliability >= 95 ? "up" : "down",
      hint: "Present or late / roster punches",
      favorable: "up",
    },
  ];

  const trend = weekDates.map((date) => {
    const rows = db.attendance.filter((row) => row.service_date === date);
    return {
      date,
      day: weekdayShort(date),
      present: countStatus(rows, "present"),
      late: countStatus(rows, "late"),
      call_out: countStatus(rows, "call_out"),
      no_show: countStatus(rows, "no_show"),
      absent: countStatus(rows, "absent"),
      pto: countStatus(rows, "pto"),
    };
  });

  const exceptions = weekRows
    .filter((row) => EXCEPTION_STATUSES.includes(row.status) || (row.status === "pto" && row.service_date === TODAY))
    .map((row) => ({
      ...row,
      driverName: driverName(db, row.driver_id),
      stationCode: stationCode(db, db.drivers.find((driver) => driver.id === row.driver_id)?.station_id ?? ""),
    }))
    .sort((a, b) => b.service_date.localeCompare(a.service_date) || a.driverName.localeCompare(b.driverName));

  const driverRows = roster
    .map((driver) => {
      const rows = weekRows.filter((row) => row.driver_id === driver.id);
      return {
        ...driver,
        stationCode: stationCode(db, driver.station_id),
        present: countStatus(rows, "present"),
        late: countStatus(rows, "late"),
        callOuts: countStatus(rows, "call_out"),
        noShows: countStatus(rows, "no_show"),
        absent: countStatus(rows, "absent"),
        pto: countStatus(rows, "pto"),
        missed: countStatus(rows, "call_out") + countStatus(rows, "no_show") + countStatus(rows, "absent"),
        days: weekDates.map((date) => rows.find((row) => row.service_date === date) ?? null),
      };
    })
    .sort((a, b) => b.missed - a.missed || a.attendance_pct - b.attendance_pct);

  return {
    kpis,
    trend,
    exceptions,
    driverRows,
    weekDates,
    today: { present, late, callOuts, noShows, absent, pto, reliability },
  };
}

export function buildPtoCalendar(db: SeedDatabase) {
  const monthDates = dateRange(MONTH_START, addDays(MONTH_START, 29));
  const lead = new Date(`${MONTH_START}T00:00:00Z`).getUTCDay();
  const mondayLead = (lead + 6) % 7;
  const gridStart = addDays(MONTH_START, -mondayLead);
  const gridDates = dateRange(gridStart, addDays(gridStart, 41));

  const activePto = db.pto.filter((row) => row.status !== "denied");
  const cells = gridDates.map((date) => {
    const entries = activePto
      .filter((row) => row.start_date <= date && row.end_date >= date)
      .map((row) => ({
        ...row,
        driverName: driverName(db, row.driver_id),
        stationCode: stationCode(db, db.drivers.find((driver) => driver.id === row.driver_id)?.station_id ?? ""),
      }));
    return {
      date,
      day: weekdayShort(date),
      inMonth: date >= MONTH_START && date <= monthDates[monthDates.length - 1],
      isToday: date === TODAY,
      entries,
      coverageRisk: entries.filter((row) => row.status === "approved" || row.status === "taken").length >= 2,
    };
  });

  const pending = db.pto.filter((row) => row.status === "pending");
  const upcoming = db.pto
    .filter((row) => (row.status === "approved" || row.status === "taken") && row.end_date >= TODAY)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const hoursApproved = sum(
    db.pto.filter((row) => row.status === "approved" || row.status === "taken").map((row) => row.hours),
  );
  const outToday = coveringPto(db, TODAY).length;

  const kpis: Kpi[] = [
    {
      label: "Out today",
      value: String(outToday),
      delta: `${coveringPto(db, TOMORROW).length} tomorrow`,
      trend: outToday > 1 ? "down" : "flat",
      hint: "Approved / taken PTO",
      favorable: "down",
    },
    {
      label: "Pending requests",
      value: String(pending.length),
      delta: pending.length ? "Needs ops review" : "Queue clear",
      trend: pending.length ? "down" : "up",
      hint: "Vacation / sick / personal",
      favorable: "down",
    },
    {
      label: "Approved hours",
      value: formatNumber(hoursApproved, 0),
      delta: `${upcoming.length} upcoming`,
      trend: "flat",
      hint: "Approved + taken on the board",
      favorable: "down",
    },
    {
      label: "Coverage risk days",
      value: String(cells.filter((cell) => cell.inMonth && cell.coverageRisk).length),
      trend: cells.some((cell) => cell.coverageRisk) ? "down" : "up",
      delta: "2+ overlapping PTO",
      hint: "September calendar",
      favorable: "down",
    },
  ];

  const requests = [...db.pto]
    .map((row) => ({
      ...row,
      driverName: driverName(db, row.driver_id),
      stationCode: stationCode(db, db.drivers.find((driver) => driver.id === row.driver_id)?.station_id ?? ""),
    }))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  return { kpis, cells, pending, upcoming, requests, monthLabel: "September 2026" };
}

export function buildStaffingForecast(db: SeedDatabase) {
  const roster = rosterDrivers(db);
  const horizon = dateRange(addDays(TODAY, -1), addDays(TODAY, 7));
  const todayRoutes = db.routes.filter((row) => row.service_date === TODAY);
  const todayForecastRoutes =
    sum(db.forecasts.filter((row) => row.forecast_date === TODAY).map((row) => row.routes_forecast)) || 1;

  const series = horizon.map((date) => {
    const forecastRows = db.forecasts.filter((row) => row.forecast_date === date);
    const forecastRoutes = sum(forecastRows.map((row) => row.routes_forecast));
    const plannedRoutes =
      date === TODAY
        ? todayRoutes.length
        : Math.max(1, Math.round(todayRoutes.length * (forecastRoutes / todayForecastRoutes)));
    const out = outDriverIds(db, date);
    const available = roster.filter((driver) => !out.has(driver.id)).length;
    const ptoOut = coveringPto(db, date).length;
    const attendanceOut = db.attendance.filter(
      (row) =>
        row.service_date === date && (row.status === "call_out" || row.status === "no_show" || row.status === "absent"),
    ).length;
    return {
      date,
      day: weekdayShort(date),
      plannedRoutes,
      forecastRoutes,
      forecastStaffing: sum(forecastRows.map((row) => row.staffing_forecast)),
      available,
      ptoOut,
      attendanceOut,
      gap: plannedRoutes - available,
      overtime: sum(forecastRows.map((row) => row.overtime_hours_forecast)),
    };
  });

  const openRoutes = todayRoutes
    .filter((route) => !route.driver_id || route.status === "planned")
    .map((route) => ({
      ...route,
      driverName: driverName(db, route.driver_id),
      stationCode: stationCode(db, route.station_id),
      reason: !route.driver_id ? "Unassigned" : "Planned / not launched",
    }));

  const uncoveredAssigned = todayRoutes.filter((route) => {
    if (!route.driver_id) return false;
    return outDriverIds(db, TODAY).has(route.driver_id);
  });

  const today = series.find((row) => row.date === TODAY)!;
  const peak = [...series].sort((a, b) => b.gap - a.gap)[0];

  const stationRows = db.stations.map((station) => {
    const stationRoster = roster.filter((driver) => driver.station_id === station.id);
    const stationRoutes = todayRoutes.filter((route) => route.station_id === station.id);
    const out = outDriverIds(db, TODAY);
    const available = stationRoster.filter((driver) => !out.has(driver.id)).length;
    const open = stationRoutes.filter((route) => !route.driver_id || route.status === "planned").length;
    const ptoOut = coveringPto(db, TODAY).filter((row) =>
      stationRoster.some((driver) => driver.id === row.driver_id),
    ).length;
    return {
      id: station.id,
      code: station.code,
      name: station.name,
      roster: stationRoster.length,
      available,
      routes: stationRoutes.length,
      open,
      ptoOut,
      gap: stationRoutes.length - available,
    };
  });

  const kpis: Kpi[] = [
    {
      label: "Staffing gap",
      value: String(Math.max(0, today.gap)),
      delta: today.gap > 0 ? `${today.available} available / ${today.plannedRoutes} routes` : "Covered",
      trend: today.gap > 0 ? "down" : "up",
      hint: "Today's wave vs. roster",
      favorable: "down",
    },
    {
      label: "Open routes",
      value: String(openRoutes.length),
      delta: uncoveredAssigned.length ? `${uncoveredAssigned.length} driver out` : "Unassigned wave",
      trend: openRoutes.length ? "down" : "up",
      hint: "No DA on the route",
      favorable: "down",
    },
    {
      label: "Call-outs + no-shows",
      value: String(today.attendanceOut),
      delta: `${today.ptoOut} on PTO`,
      trend: today.attendanceOut ? "down" : "up",
      hint: "Today's reliability hits",
      favorable: "down",
    },
    {
      label: "Peak shortage",
      value: peak ? `${peak.day} ${Math.max(0, peak.gap)}` : "—",
      delta: peak ? peak.date.slice(5) : "",
      trend: peak && peak.gap > 0 ? "down" : "flat",
      hint: "Next 8 days",
      favorable: "down",
    },
  ];

  return { kpis, series, openRoutes, stationRows, today, peak };
}

export const RECRUITING_COLUMNS: { stage: RecruitingStage; label: string }[] = [
  { stage: "applied", label: "Applied" },
  { stage: "phone_screen", label: "Phone screen" },
  { stage: "interview", label: "Interview" },
  { stage: "ride_along", label: "Ride-along" },
  { stage: "offer", label: "Offer" },
  { stage: "hired", label: "Hired" },
];

export function buildRecruitingPipeline(db: SeedDatabase) {
  const open = db.recruiting.filter((row) => row.status === "open");
  const hired = db.recruiting.filter((row) => row.status === "hired");
  const closed = db.recruiting.filter((row) => row.status === "rejected" || row.status === "withdrawn");
  const thisWeekInterviews = db.interviews.filter((row) => {
    const day = row.scheduled_at.slice(0, 10);
    return day >= WEEK_START && day <= addDays(TODAY, 7);
  });
  const upcoming = db.interviews
    .filter((row) => row.result === "scheduled" && row.scheduled_at.slice(0, 10) >= TODAY)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const columns = RECRUITING_COLUMNS.map((column) => ({
    ...column,
    candidates: db.recruiting
      .filter((row) => row.stage === column.stage)
      .map((row) => ({
        ...row,
        stationCode: stationCode(db, row.station_id),
        nextInterview: db.interviews
          .filter((interview) => interview.recruiting_id === row.id)
          .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))[0] as Interview | undefined,
      })),
  }));

  const interviewRows = [...db.interviews]
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .map((row) => {
      const candidate = db.recruiting.find((item) => item.id === row.recruiting_id);
      return {
        ...row,
        candidateName: candidate?.full_name ?? row.recruiting_id,
        stationCode: candidate ? stationCode(db, candidate.station_id) : "",
        source: candidate?.source ?? "",
        pipelineStage: candidate?.stage ?? "applied",
      };
    });

  const kpis: Kpi[] = [
    {
      label: "Open pipeline",
      value: String(open.length),
      delta: `${hired.length} hired`,
      trend: open.length >= 5 ? "up" : "down",
      hint: "Active DA candidates",
      favorable: "up",
    },
    {
      label: "Interview stages",
      value: String(thisWeekInterviews.length),
      delta: `${upcoming.length} upcoming`,
      trend: "flat",
      hint: "This week + next 7 days",
      favorable: "up",
    },
    {
      label: "Offers out",
      value: String(db.recruiting.filter((row) => row.stage === "offer").length),
      delta: db.recruiting.find((row) => row.stage === "offer")?.full_name ?? "None pending",
      trend: "up",
      hint: "Verbal / written",
      favorable: "up",
    },
    {
      label: "Closed out",
      value: String(closed.length),
      delta: `${db.recruiting.filter((row) => row.status === "rejected").length} rejected`,
      trend: "flat",
      hint: "Rejected + withdrawn",
      favorable: "down",
    },
  ];

  return { kpis, columns, interviewRows, upcoming, closed, openCount: open.length };
}

function trainingProgress(records: TrainingRecord[]): { done: number; total: number; pct: number; overdue: number } {
  const required = records.filter((row) => row.required);
  const done = required.filter((row) => row.status === "completed" || row.status === "waived").length;
  const overdue = required.filter((row) => row.status === "overdue").length;
  const total = required.length || 1;
  return { done, total: required.length, pct: required.length ? done / total : 0, overdue };
}

export function buildDriverLifecycle(db: SeedDatabase) {
  const byDriver = (driverId: string) => db.trainingRecords.filter((row) => row.driver_id === driverId);

  const lifecycleOf = (status: EmploymentStatus) =>
    db.drivers
      .filter((driver) => driver.employment_status === status)
      .map((driver) => {
        const records = byDriver(driver.id);
        const progress = trainingProgress(records);
        const candidate = db.recruiting.find((row) => row.driver_id === driver.id);
        return {
          ...driver,
          stationCode: stationCode(db, driver.station_id),
          records,
          ...progress,
          recruiter: candidate?.recruiter ?? "—",
          source: candidate?.source ?? "—",
        };
      });

  const onboarding = lifecycleOf("onboarding");
  const offboarding = lifecycleOf("offboarding");
  const terminated = lifecycleOf("terminated");
  const overdue = db.trainingRecords
    .filter((row) => row.status === "overdue")
    .map((row) => ({
      ...row,
      driverName: driverName(db, row.driver_id),
      stationCode: stationCode(db, db.drivers.find((driver) => driver.id === row.driver_id)?.station_id ?? ""),
    }));

  const courses = [...new Set(db.trainingRecords.map((row) => row.course))].map((course) => {
    const rows = db.trainingRecords.filter((row) => row.course === course);
    const completed = rows.filter((row) => row.status === "completed" || row.status === "waived").length;
    return {
      course,
      category: rows[0]?.category ?? "compliance",
      total: rows.length,
      completed,
      overdue: rows.filter((row) => row.status === "overdue").length,
      pct: rows.length ? completed / rows.length : 0,
    };
  });

  const onboardingPct = onboarding.length
    ? (onboarding.reduce((sumPct, row) => sumPct + row.pct, 0) / onboarding.length) * 100
    : 0;

  const kpis: Kpi[] = [
    {
      label: "Onboarding",
      value: String(onboarding.length),
      delta: onboarding.length ? `${formatPct(onboardingPct)} complete` : "None in class",
      trend: onboarding.length ? "up" : "flat",
      hint: "New DAs in training",
      favorable: "up",
    },
    {
      label: "Offboarding",
      value: String(offboarding.length),
      delta: offboarding[0]?.full_name ?? "None in progress",
      trend: offboarding.length ? "down" : "up",
      hint: "Exit checklist open",
      favorable: "down",
    },
    {
      label: "Training overdue",
      value: String(overdue.length),
      delta: overdue[0]?.course ?? "All current",
      trend: overdue.length ? "down" : "up",
      hint: "Required courses past due",
      favorable: "down",
    },
    {
      label: "Recently separated",
      value: String(terminated.length),
      delta: terminated[0] ? (terminated[0].termination_date ?? "") : "—",
      trend: "flat",
      hint: "Completed offboarding",
      favorable: "down",
    },
  ];

  return { kpis, onboarding, offboarding, terminated, overdue, courses, records: db.trainingRecords };
}
