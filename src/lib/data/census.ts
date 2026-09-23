/**
 * ADP Workforce Now Employee Census contacts.
 * Names in the export are First [Middle|Initial] Last. Phones and emails are
 * copied only when one census row matches one associate name.
 */
import census from "@/lib/data/seed/adp-employee-census.json";
import { nameTokens } from "@/lib/compliance/names";

export type EmploymentStatus = "active" | "terminated" | "deceased";

export interface CensusEmployee {
  name: string;
  positionId: string;
  phone: string;
  mobile: string;
  email: string;
  status: string;
}

export const censusEmployees = census.employees as CensusEmployee[];

export function employmentStatus(status: string): EmploymentStatus | null {
  if (status.startsWith("A")) return "active";
  if (status.startsWith("T")) return "terminated";
  if (status.startsWith("D")) return "deceased";
  return null;
}

export function employmentLabel(status: EmploymentStatus | undefined) {
  if (status === "active") return "Active";
  if (status === "terminated") return "Terminated";
  if (status === "deceased") return "Deceased";
  return "Not in census";
}

function parts(name: string) {
  const tokens = nameTokens(name);
  if (tokens.length === 0) return null;
  if (tokens.length === 1) return { first: tokens[0], last: "", middles: [] as string[] };
  return {
    first: tokens[0],
    last: tokens[tokens.length - 1],
    middles: tokens.slice(1, -1),
  };
}

function middlesCompatible(rosterMiddles: string[], censusMiddles: string[]) {
  if (rosterMiddles.length === 0 || censusMiddles.length === 0) return true;
  return censusMiddles.every((middle) =>
    rosterMiddles.some((roster) => roster === middle || (middle.length === 1 && roster.startsWith(middle)))
  );
}

function sameTokens(a: string, b: string) {
  const left = nameTokens(a).slice().sort().join(" ");
  const right = nameTokens(b).slice().sort().join(" ");
  return left.length > 0 && left === right;
}

function isFirstPrefix(amazonFirst: string, censusFirst: string) {
  if (amazonFirst === censusFirst) return false;
  const [shorter, longer] =
    amazonFirst.length <= censusFirst.length ? [amazonFirst, censusFirst] : [censusFirst, amazonFirst];
  return shorter.length >= 4 && longer.startsWith(shorter);
}

function damerau(a: string, b: string) {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return 2;
  const dp: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i += 1) dp[i][0] = i;
  for (let j = 0; j <= lb; j += 1) dp[0][j] = j;
  for (let i = 1; i <= la; i += 1) {
    for (let j = 1; j <= lb; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[la][lb];
}

/** Higher is a closer name. 0 means the census row is not a candidate. */
export function censusMatchScore(rosterName: string, censusName: string) {
  if (sameTokens(rosterName, censusName)) return 100;
  const roster = parts(rosterName);
  const employee = parts(censusName);
  if (!roster || !employee) return 0;
  if (roster.first !== "" && roster.last === "" && employee.last === "" && roster.first === employee.first) {
    return 100;
  }
  if (!roster.last || !employee.last) return 0;
  const middlesOk = middlesCompatible(roster.middles, employee.middles);
  if (roster.first === employee.first && roster.last === employee.last && middlesOk) {
    return roster.middles.length === 0 || employee.middles.length === 0 ? 90 : 95;
  }
  if (isFirstPrefix(roster.first, employee.first) && roster.last === employee.last && middlesOk) return 80;
  if (
    roster.first === employee.first &&
    roster.last.length >= 5 &&
    employee.last.length >= 5 &&
    damerau(roster.last, employee.last) === 1 &&
    middlesOk
  ) {
    return 70;
  }
  return 0;
}

/**
 * One census employee for a roster name. Active wins over terminated or deceased
 * when both spellings match. Two different employees at the best score match nobody.
 */
export function matchCensusEmployee(
  rosterName: string,
  employees: readonly CensusEmployee[] = censusEmployees
): CensusEmployee | null {
  const scored = employees.flatMap((employee) => {
    const score = censusMatchScore(rosterName, employee.name);
    return score > 0 ? [{ score, employee }] : [];
  });
  if (scored.length === 0) return null;
  const best = Math.max(...scored.map((row) => row.score));
  let tops = scored.filter((row) => row.score === best);
  const active = tops.filter((row) => employmentStatus(row.employee.status) === "active");
  if (active.length > 0) tops = active;
  const ids = new Set(tops.map((row) => row.employee.positionId));
  if (ids.size !== 1) return null;
  return tops[0]?.employee ?? null;
}

export function publishedPhone(employee: CensusEmployee) {
  const phone = employee.phone.trim();
  if (phone) return phone;
  const mobile = employee.mobile.trim();
  return mobile || undefined;
}

export function publishedEmail(employee: CensusEmployee) {
  const email = employee.email.trim();
  return email || undefined;
}
