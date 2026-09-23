/** Parse a captured USD string such as "$1,000.00" into integer cents. */
export function parseUsdToCents(value: string): number {
  const cleaned = value.trim().replace(/[$,]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error(`Cannot parse USD amount: ${value}`);
  }
  const negative = cleaned.startsWith("-");
  const [whole, frac = ""] = cleaned.replace("-", "").split(".");
  if (frac.length > 2 && /[1-9]/.test(frac.slice(2))) {
    throw new Error(`USD amount has more than 2 decimal places: ${value}`);
  }
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return negative ? -cents : cents;
}

export function sumCents(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
