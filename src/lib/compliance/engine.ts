import { adpNameParts, collapseSpaces, matchAmazonName } from "@/lib/compliance/names";
import type {
  AdpPunchRow,
  AmazonBreakStatus,
  EvaluateInput,
  ExceptionRow,
  MatchMethod,
  MealRow,
  Over60Peak,
  Over60Window,
  ScheduleDay,
  UnmatchedRow,
} from "@/lib/compliance/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AMAZON_MEAL_TIMES = "Not in capture";

export interface Evaluation {
  missingPunches: ExceptionRow[];
  over12: ExceptionRow[];
  over60: ExceptionRow[];
  over60Peak: Over60Peak | null;
  over60Windows: Over60Window[];
  mealRows: MealRow[];
  unmatchedAmazon: UnmatchedRow[];
  unmatchedAdp: UnmatchedRow[];
  notes: string[];
}

interface Link {
  adpName: string;
  method: MatchMethod;
  positionId: string;
}

interface PunchSegment {
  timeIn: string;
  timeOut: string;
  hours: number | null;
  outType: string;
  payCode: string;
}

export function evaluateTimecards(input: EvaluateInput): Evaluation {
  const coverage = new Set(input.coverageDates);
  const week = new Set(input.weekDates);
  const adpNames = uniqueAdpNames(input.punches);
  const positionByName = new Map<string, string>();
  for (const row of input.punches) {
    if (!positionByName.has(row.name)) positionByName.set(row.name, row.positionId);
  }

  const links = new Map<string, Link>();
  const unmatchedAmazon: UnmatchedRow[] = [];
  const claimedAdp = new Map<string, string[]>();

  for (const associate of input.associates) {
    const match = matchAmazonName(associate.name, adpNames);
    if (match.status === "matched") {
      const owners = claimedAdp.get(match.adpName) ?? [];
      owners.push(associate.name);
      claimedAdp.set(match.adpName, owners);
      links.set(associate.name, {
        adpName: match.adpName,
        method: match.method,
        positionId: positionByName.get(match.adpName) ?? "",
      });
    } else if (match.status === "ambiguous") {
      unmatchedAmazon.push(
        unmatchedAmazonRow(
          associate.name,
          associate.transporterId,
          associate.days,
          `More than one ADP name matched: ${match.adpNames.join("; ")}.`
        )
      );
    } else {
      unmatchedAmazon.push(
        unmatchedAmazonRow(
          associate.name,
          associate.transporterId,
          associate.days,
          "No ADP Group Timecard name matched on first name and last name."
        )
      );
    }
  }

  for (const [adpName, owners] of claimedAdp) {
    if (owners.length < 2) continue;
    for (const amazonName of owners) {
      const associate = input.associates.find((row) => row.name === amazonName);
      links.delete(amazonName);
      unmatchedAmazon.push(
        unmatchedAmazonRow(
          amazonName,
          associate?.transporterId ?? "",
          associate?.days ?? [],
          `ADP name ${adpName} also matched ${owners.filter((name) => name !== amazonName).join("; ")}.`
        )
      );
    }
  }

  const linkedAdp = new Set([...links.values()].map((link) => link.adpName));
  const amazonByAdp = new Map<string, { name: string; transporterId: string; method: MatchMethod }>();
  for (const associate of input.associates) {
    const link = links.get(associate.name);
    if (!link) continue;
    amazonByAdp.set(link.adpName, {
      name: associate.name,
      transporterId: associate.transporterId,
      method: link.method,
    });
  }

  const dayByAssociate = new Map<string, Map<string, ScheduleDay>>();
  for (const associate of input.associates) {
    dayByAssociate.set(associate.name, new Map(associate.days.map((day) => [day.date, day])));
  }

  const rawByPersonDay = new Map<string, AdpPunchRow[]>();
  for (const row of input.punches) {
    const key = personDay(row.name, row.date);
    const list = rawByPersonDay.get(key) ?? [];
    list.push(row);
    rawByPersonDay.set(key, list);
  }

  const segmentsByPersonDay = new Map<string, PunchSegment[]>();
  const notes = [...input.sourceNotes];

  for (const [key, rows] of rawByPersonDay) {
    const content = rows.filter(rowHasContent);
    if (content.length === 0) continue;
    const { kept, collapsed } = dedupeRows(content);
    segmentsByPersonDay.set(
      key,
      kept.map((row) => ({
        timeIn: row.timeIn.trim(),
        timeOut: row.timeOut.trim(),
        hours: parseHours(row.hours),
        outType: row.outType.trim(),
        payCode: row.payCode.trim(),
      }))
    );
    if (collapsed > 0) {
      const [adpName, date] = key.split("|");
      notes.push(
        `${adpName} on ${dateLabel(date)}: the Group Timecard repeated ${collapsed} identical in/out/hours row${collapsed === 1 ? "" : "s"}. Hours count each distinct span once and keep a Meal Punch out type when the duplicate row has one.`
      );
    }
  }

  notes.push(...individualDiscrepancies(input, rawByPersonDay));

  const missingPunches: ExceptionRow[] = [];
  for (const associate of input.associates) {
    const link = links.get(associate.name);
    if (!link) continue;
    for (const day of associate.days) {
      if (!coverage.has(day.date)) continue;
      const signals = workSignals(day);
      if (signals.length === 0) continue;
      const segments = segmentsByPersonDay.get(personDay(link.adpName, day.date)) ?? [];
      if (segments.some(isComplete)) continue;
      const partial = segments.length > 0;
      const hours = sumHours(segments);
      missingPunches.push(
        exceptionRow({
          id: `missing:${associate.transporterId}:${day.date}`,
          associate: collapseSpaces(associate.name),
          adpName: link.adpName,
          transporterId: associate.transporterId,
          positionId: link.positionId,
          date: day.date,
          amazonTimes: formatAmazonDay(day),
          adpTimes: formatSegments(segments),
          hoursLabel: hours == null ? "—" : `${formatHours(hours)} ADP`,
          rule: partial
            ? `Incomplete ADP punch while Amazon shows ${signals.join(" and ")}. A matching in/out needs both a time in and a time out.`
            : `No ADP in/out while Amazon shows ${signals.join(" and ")} on a Group Timecard day.`,
          matchMethod: link.method,
        })
      );
    }
  }

  const over12: ExceptionRow[] = [];
  const seenOver12 = new Set<string>();

  for (const [key, segments] of segmentsByPersonDay) {
    const [adpName, date] = key.split("|");
    if (!week.has(date)) continue;
    const hours = sumHours(segments);
    if (hours == null || hours <= 12) continue;
    const amazon = amazonByAdp.get(adpName);
    const day = amazon ? dayByAssociate.get(amazon.name)?.get(date) : undefined;
    seenOver12.add(key);
    over12.push(
      exceptionRow({
        id: `over12:${adpName}:${date}`,
        associate: amazon ? collapseSpaces(amazon.name) : adpName,
        adpName,
        transporterId: amazon?.transporterId ?? "",
        positionId: positionByName.get(adpName) ?? "",
        date,
        amazonTimes: day ? formatAmazonDay(day) : "—",
        adpTimes: formatSegments(segments),
        hoursLabel: `${formatHours(hours)} ADP`,
        rule: "More than 12 hours in this calendar day. Hours are ADP punch hours.",
        matchMethod: amazon?.method ?? null,
      })
    );
  }

  for (const associate of input.associates) {
    const link = links.get(associate.name);
    if (!link) continue;
    for (const day of associate.days) {
      if (!week.has(day.date) || !day.workBlock) continue;
      if (day.workBlock.durationHours <= 12) continue;
      const key = personDay(link.adpName, day.date);
      if (seenOver12.has(key)) continue;
      const segments = segmentsByPersonDay.get(key) ?? [];
      if (sumHours(segments) != null) continue;
      over12.push(
        exceptionRow({
          id: `over12-block:${associate.transporterId}:${day.date}`,
          associate: collapseSpaces(associate.name),
          adpName: link.adpName,
          transporterId: associate.transporterId,
          positionId: link.positionId,
          date: day.date,
          amazonTimes: formatAmazonDay(day),
          adpTimes: formatSegments(segments),
          hoursLabel: `${formatHours(day.workBlock.durationHours)} Amazon block`,
          rule: "More than 12 hours in this calendar day. ADP has no punch hours, so the rostered work-block duration is used.",
          matchMethod: link.method,
        })
      );
    }
  }

  const windows = input.weekDates.map((end) => {
    const start = addDays(end, -6);
    const coverageDates = input.coverageDates.filter((date) => date >= start && date <= end);
    return { start, end, coverageDates };
  });

  const over60: ExceptionRow[] = [];
  let peak: { hours: number; adpName: string; start: string; end: string; coverageDates: string[] } | null =
    null;

  for (const adpName of adpNames) {
    for (const window of windows) {
      const datesWithHours: string[] = [];
      let total = 0;
      let any = false;
      for (const date of input.coverageDates) {
        if (date < window.start || date > window.end) continue;
        const hours = sumHours(segmentsByPersonDay.get(personDay(adpName, date)) ?? []);
        if (hours == null) continue;
        any = true;
        total += hours;
        datesWithHours.push(date);
      }
      const rounded = Math.round(total * 100) / 100;
      if (any && (peak == null || rounded > peak.hours)) {
        peak = {
          hours: rounded,
          adpName,
          start: window.start,
          end: window.end,
          coverageDates: window.coverageDates,
        };
      }
      if (rounded <= 60) continue;
      const amazon = amazonByAdp.get(adpName);
      const row = exceptionRow({
        id: `over60:${adpName}:${window.end}`,
        associate: amazon ? collapseSpaces(amazon.name) : adpName,
        adpName,
        transporterId: amazon?.transporterId ?? "",
        positionId: positionByName.get(adpName) ?? "",
        date: window.end,
        amazonTimes: "—",
        adpTimes: datesWithHours.length
          ? datesWithHours
              .map((date) => {
                const hours = sumHours(segmentsByPersonDay.get(personDay(adpName, date)) ?? []);
                return `${dateLabel(date)} ${hours == null ? "—" : `${formatHours(hours)}h`}`;
              })
              .join("\n")
          : "No ADP hours in this window",
        hoursLabel: `${formatHours(rounded)} ADP`,
        rule: `More than 60 hours in the rolling 7-day window ending ${dateLabel(window.end)} (${shortDate(window.start)}–${shortDate(window.end)}). ${coverageSentence(window.coverageDates)}. Earlier days outside the Group Timecard capture are not treated as zero and are not filled from the Amazon schedule.`,
        matchMethod: amazon?.method ?? null,
      });
      row.dateLabel = `${shortDate(window.start)}–${shortDate(window.end)}`;
      over60.push(row);
    }
  }

  const mealRows: MealRow[] = [];
  for (const breakDay of input.breaks) {
    const associate = input.associates.find(
      (row) => collapseSpaces(row.name).toLowerCase() === collapseSpaces(breakDay.associateName).toLowerCase()
    );
    const link = associate ? links.get(associate.name) : undefined;
    const segments = link ? (segmentsByPersonDay.get(personDay(link.adpName, breakDay.date)) ?? []) : [];
    const meal = mealKind(segments);
    const mismatch = link ? mealDisagrees(breakDay.status, meal) : false;
    const day = associate ? dayByAssociate.get(associate.name)?.get(breakDay.date) : undefined;
    const schedule = day ? formatAmazonDay(day) : "—";
    const hours = sumHours(segments);
    const base = exceptionRow({
      id: `meal:${collapseSpaces(breakDay.associateName)}:${breakDay.date}`,
      associate: collapseSpaces(breakDay.associateName),
      adpName: link?.adpName ?? "—",
      transporterId: associate?.transporterId ?? "",
      positionId: link?.positionId ?? "",
      date: breakDay.date,
      amazonTimes: schedule === "—" ? AMAZON_MEAL_TIMES : `${AMAZON_MEAL_TIMES}\n${schedule}`,
      adpTimes: link ? formatSegments(segments) : "Not joined to ADP",
      hoursLabel: hours == null ? "—" : `${formatHours(hours)} ADP`,
      rule: mealRule(breakDay.status, meal, Boolean(link), mismatch),
      matchMethod: link?.method ?? null,
    });
    mealRows.push({
      ...base,
      mismatch,
      amazonStatus: breakStatusLabel(breakDay.status),
      adpMeal: mealLabel(meal, segments.length > 0),
    });
  }

  const unmatchedAdp: UnmatchedRow[] = [];
  for (const adpName of adpNames) {
    if (linkedAdp.has(adpName)) continue;
    const punchedDates = input.coverageDates.filter((date) => {
      const segments = segmentsByPersonDay.get(personDay(adpName, date)) ?? [];
      return segments.length > 0;
    });
    const parts = adpNameParts(adpName);
    unmatchedAdp.push({
      id: `adp:${adpName}`,
      name: adpName,
      secondary: positionByName.get(adpName) ?? "",
      detail: punchedDates.length
        ? `Punches on ${punchedDates.map(dateLabel).join(", ")}`
        : "No in/out on captured Group Timecard days",
      reason: parts
        ? `No Amazon ${input.rosterWeekLabel ?? "Week 39"} roster name matched.`
        : "ADP name is not LAST, FIRST, so it was left unmatched.",
      searchText: [adpName, positionByName.get(adpName) ?? "", ...punchedDates].join(" ").toLowerCase(),
      dateKeys: punchedDates,
    });
  }

  unmatchedAmazon.sort((a, b) => a.name.localeCompare(b.name));
  unmatchedAdp.sort((a, b) => a.name.localeCompare(b.name));
  sortRows(missingPunches);
  sortRows(over12);
  sortRows(over60);
  sortRows(mealRows);

  const over60Peak: Over60Peak | null = peak
    ? {
        associate: amazonByAdp.get(peak.adpName)
          ? collapseSpaces(amazonByAdp.get(peak.adpName)!.name)
          : peak.adpName,
        adpName: peak.adpName,
        hoursLabel: formatHours(peak.hours),
        windowLabel: `${shortDate(peak.start)}–${shortDate(peak.end)}`,
        coverageLabel: coverageSentence(peak.coverageDates),
      }
    : null;

  return {
    missingPunches,
    over12,
    over60,
    over60Peak,
    over60Windows: windows.map((window) => ({
      label: `${shortDate(window.start)}–${shortDate(window.end)}`,
      coverageLabel: coverageSentence(window.coverageDates),
    })),
    mealRows,
    unmatchedAmazon,
    unmatchedAdp,
    notes,
  };
}

function unmatchedAmazonRow(
  name: string,
  transporterId: string,
  days: ScheduleDay[],
  reason: string
): UnmatchedRow {
  const workDates = days.filter((day) => workSignals(day).length > 0).map((day) => day.date);
  return {
    id: `amazon:${transporterId || name}`,
    name: collapseSpaces(name),
    secondary: transporterId,
    detail: workDates.length
      ? `Amazon work on ${workDates.map(dateLabel).join(", ")}`
      : "No rostered block or scheduled shift this week",
    reason,
    searchText: [name, transporterId, ...workDates].join(" ").toLowerCase(),
    dateKeys: workDates,
  };
}

function exceptionRow(row: Omit<ExceptionRow, "dateLabel" | "searchText">): ExceptionRow {
  return {
    ...row,
    dateLabel: dateLabel(row.date),
    searchText: [row.associate, row.adpName, row.transporterId, row.positionId, row.date, row.rule]
      .join(" ")
      .toLowerCase(),
  };
}

function uniqueAdpNames(punches: AdpPunchRow[]) {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const row of punches) {
    if (seen.has(row.name)) continue;
    seen.add(row.name);
    names.push(row.name);
  }
  return names;
}

function personDay(name: string, date: string) {
  return `${name}|${date}`;
}

function rowHasContent(row: AdpPunchRow) {
  return Boolean(row.timeIn.trim() || row.timeOut.trim() || row.hours.trim() || row.outType.trim() || row.payCode.trim());
}

function dedupeRows(rows: AdpPunchRow[]) {
  const kept: AdpPunchRow[] = [];
  let collapsed = 0;
  for (const row of rows) {
    const index = kept.findIndex(
      (existing) =>
        existing.timeIn.trim() === row.timeIn.trim() &&
        existing.timeOut.trim() === row.timeOut.trim() &&
        existing.hours.trim() === row.hours.trim()
    );
    if (index >= 0) {
      collapsed += 1;
      const existing = kept[index];
      if (!existing.outType.trim() && row.outType.trim()) {
        kept[index] = { ...existing, outType: row.outType };
      }
      if (!existing.payCode.trim() && row.payCode.trim()) {
        kept[index] = { ...kept[index], payCode: row.payCode };
      }
      continue;
    }
    kept.push({ ...row });
  }
  return { kept, collapsed };
}

function parseHours(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sumHours(segments: PunchSegment[]) {
  const values = segments.map((segment) => segment.hours).filter((hours): hours is number => hours != null);
  if (values.length === 0) return null;
  const cents = values.reduce((total, hours) => total + Math.round(hours * 100), 0);
  return cents / 100;
}

function isComplete(segment: PunchSegment) {
  return Boolean(segment.timeIn && segment.timeOut);
}

function workSignals(day: ScheduleDay) {
  const signals: string[] = [];
  if (day.workBlock) signals.push("a rostered work block");
  if (day.shift && !day.shift.unavailable) signals.push("a scheduled shift");
  return signals;
}

function formatAmazonDay(day: ScheduleDay) {
  const lines: string[] = [];
  if (day.workBlock) {
    lines.push(`Block: ${day.workBlock.route} · ${day.workBlock.start} · ${formatHours(day.workBlock.durationHours)} hrs`);
  }
  if (day.shift?.unavailable) {
    lines.push("Shift: Unavailable");
  } else if (day.shift) {
    const hours = day.shift.durationHours == null ? "" : ` · ${formatHours(day.shift.durationHours)}h`;
    lines.push(`Shift: ${day.shift.role} · ${day.shift.start ?? "—"}${hours}`);
  }
  return lines.join("\n") || "—";
}

function formatSegments(segments: PunchSegment[]) {
  if (segments.length === 0) return "No ADP punch";
  return segments
    .map((segment) => {
      const span =
        segment.timeIn && segment.timeOut
          ? `${segment.timeIn}–${segment.timeOut}`
          : segment.timeIn
            ? `${segment.timeIn} in, no out`
            : segment.timeOut
              ? `no in, ${segment.timeOut} out`
              : "No clock time";
      const hours = segment.hours == null ? "" : ` · ${formatHours(segment.hours)}h`;
      const outType = segment.outType ? ` · ${segment.outType}` : "";
      const payCode = segment.payCode ? ` · ${segment.payCode}` : "";
      return `${span}${hours}${outType}${payCode}`;
    })
    .join("\n");
}

type MealKind = "meal_punch" | "no_meal" | "punched" | "none";

function mealKind(segments: PunchSegment[]): MealKind {
  const outTypes = segments.map((segment) => segment.outType.toLowerCase());
  const payCodes = segments.map((segment) => segment.payCode.toLowerCase());
  if (outTypes.includes("meal punch") || payCodes.includes("meal punch")) return "meal_punch";
  if (outTypes.includes("no meal") || payCodes.includes("no meal")) return "no_meal";
  if (segments.length > 0) return "punched";
  return "none";
}

function mealDisagrees(status: AmazonBreakStatus, meal: MealKind) {
  if (meal === "meal_punch") return true;
  if (status === "missing_punch" && meal === "no_meal") return true;
  return false;
}

function mealLabel(meal: MealKind, hasPunch: boolean) {
  switch (meal) {
    case "meal_punch":
      return "Meal Punch";
    case "no_meal":
      return "No Meal";
    case "punched":
      return hasPunch ? "No meal punch recorded" : "No ADP punch";
    case "none":
      return "No ADP punch";
  }
}

function breakStatusLabel(status: AmazonBreakStatus) {
  return status === "non_compliant" ? "Non-compliant" : "Missing Punch";
}

function mealRule(status: AmazonBreakStatus, meal: MealKind, joined: boolean, mismatch: boolean) {
  const amazon = breakStatusLabel(status);
  if (!joined) {
    return `Amazon Compliance Breaks says ${amazon}. This name did not join to an ADP employee, so it is not counted as a meal mismatch.`;
  }
  if (mismatch && meal === "meal_punch") {
    return `Meal disagreement. Amazon Compliance Breaks says ${amazon}. ADP Out Type is Meal Punch. Amazon meal start and end were not in the capture.`;
  }
  if (mismatch && meal === "no_meal") {
    return `Meal disagreement. Amazon Compliance Breaks says ${amazon}. ADP says No Meal.`;
  }
  if (status === "missing_punch" && meal === "none") {
    return "Aligned. Amazon Compliance Breaks says Missing Punch and ADP has no punch that day. Counted with missing punches, not as a meal mismatch.";
  }
  if (status === "missing_punch") {
    return "Aligned. Amazon Compliance Breaks says Missing Punch and ADP has no Meal Punch out type. Not counted as a meal mismatch.";
  }
  return "Aligned. Amazon Compliance Breaks and the ADP meal out type do not contradict. Not counted as a meal mismatch.";
}

function individualDiscrepancies(input: EvaluateInput, rawByPersonDay: Map<string, AdpPunchRow[]>) {
  const lines: string[] = [];
  const nameByPosition = new Map<string, string>();
  for (const row of input.punches) {
    if (!nameByPosition.has(row.positionId)) nameByPosition.set(row.positionId, row.name);
  }
  for (const card of input.individuals) {
    for (const day of card.days) {
      const adpName = nameByPosition.get(card.positionId);
      if (!adpName) continue;
      const groupRows = (rawByPersonDay.get(personDay(adpName, day.date)) ?? []).filter(rowHasContent);
      if (groupRows.length > 0 && day.segments.length === 0) {
        lines.push(
          `${card.name} (${card.positionId}) individual timecard has no segments on ${dateLabel(day.date)}, and the Group Timecard does. Hour rules use the Group Timecard.`
        );
      }
    }
  }
  return lines;
}

function coverageSentence(dates: string[]) {
  if (dates.length === 0) return "No Group Timecard day falls in this window";
  return `${dates.length} of 7 days captured (${dates.map(dateLabel).join(", ")})`;
}

function sortRows<T extends { date: string; associate: string }>(rows: T[]) {
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.associate.localeCompare(b.associate));
}

export function formatHours(value: number) {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function dateLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${MONTHS[month - 1]} ${day}`;
}

function shortDate(iso: string) {
  const [, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

function addDays(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
