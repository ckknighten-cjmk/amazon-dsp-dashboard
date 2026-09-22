import type { MatchMethod } from "@/lib/compliance/types";

const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);

export function collapseSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function nameTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token && !SUFFIXES.has(token));
}

export interface AdpNameParts {
  first: string;
  last: string;
}

/** ADP Group Timecard names are `LAST, FIRST`. Names without a comma are not split. */
export function adpNameParts(name: string): AdpNameParts | null {
  if (!name.includes(",")) return null;
  const [lastRaw, firstRaw] = name.split(",", 2);
  const lastTokens = nameTokens(lastRaw);
  const firstTokens = nameTokens(firstRaw);
  if (lastTokens.length === 0 || firstTokens.length === 0) return null;
  return { first: firstTokens[0], last: lastTokens.join("") };
}

export type NameMatch =
  | { status: "matched"; adpName: string; method: MatchMethod }
  | { status: "ambiguous"; adpNames: string[] }
  | { status: "unmatched" };

/**
 * Join an Amazon roster name to one ADP name.
 * Exact first + last wins. Prefix first names (Jazmon / Jazmonjr), a middle
 * token used as the ADP surname (Sandoval Arellano), and a one-edit last name
 * (Mosley / Mosely) are allowed when that best score is unique.
 */
export function matchAmazonName(amazonName: string, adpNames: readonly string[]): NameMatch {
  const tokens = nameTokens(amazonName);
  if (tokens.length === 0) return { status: "unmatched" };
  const first = tokens[0];
  const rest = tokens.slice(1);
  const last = rest[rest.length - 1] ?? "";
  const middles = rest.slice(0, -1);

  const scored: Array<{ score: number; name: string; method: MatchMethod }> = [];
  for (const adpName of adpNames) {
    const parts = adpNameParts(adpName);
    if (!parts) continue;
    const firstExact = parts.first === first;
    const firstPrefix = isFirstPrefix(first, parts.first);
    const lastExact = Boolean(last) && parts.last === last;
    if (lastExact && firstExact) {
      scored.push({ score: 100, name: adpName, method: "exact" });
    } else if (lastExact && firstPrefix) {
      scored.push({ score: 90, name: adpName, method: "first-name-prefix" });
    } else if (firstExact && middles.includes(parts.last)) {
      scored.push({ score: 80, name: adpName, method: "compound-surname" });
    } else if (
      firstExact &&
      last.length >= 5 &&
      parts.last.length >= 5 &&
      damerau(last, parts.last) === 1
    ) {
      scored.push({ score: 70, name: adpName, method: "last-name-typo" });
    }
  }

  if (scored.length === 0) return { status: "unmatched" };
  const best = Math.max(...scored.map((row) => row.score));
  const tops = [...new Set(scored.filter((row) => row.score === best).map((row) => row.name))];
  if (tops.length !== 1) return { status: "ambiguous", adpNames: tops };
  const winner = scored.find((row) => row.name === tops[0] && row.score === best);
  if (!winner) return { status: "unmatched" };
  return { status: "matched", adpName: winner.name, method: winner.method };
}

function isFirstPrefix(amazonFirst: string, adpFirst: string) {
  if (amazonFirst === adpFirst) return false;
  const [shorter, longer] =
    amazonFirst.length <= adpFirst.length
      ? [amazonFirst, adpFirst]
      : [adpFirst, amazonFirst];
  return shorter.length >= 4 && longer.startsWith(shorter);
}

/** Damerau–Levenshtein distance so an adjacent transposition counts as one edit. */
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

export function matchMethodLabel(method: MatchMethod) {
  switch (method) {
    case "exact":
      return "Exact name";
    case "first-name-prefix":
      return "Fuzzy first name";
    case "compound-surname":
      return "Compound surname";
    case "last-name-typo":
      return "Fuzzy last name";
  }
}
