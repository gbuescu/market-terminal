/** Simple moving average. Returns an array aligned to `values`; the first
 * `period-1` entries are null (not enough history yet). */
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 1 || values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** Percent change of each point from the first point: (v/v0 - 1) * 100. */
export function normalizePct(values: number[]): number[] {
  const base = values[0];
  if (!base) return values.map(() => 0);
  return values.map((v) => (v / base - 1) * 100);
}
