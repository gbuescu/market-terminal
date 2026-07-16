/**
 * Free-tier request budgeting. Every outbound provider request is recorded
 * in request_log and checked against conservative per-minute / per-day
 * budgets (set BELOW the published free-tier limits — safeguards, not
 * workarounds). When a budget is exhausted the adapter throws BudgetError
 * before making the request; the cache layer then serves stale data if it
 * has any, so the app degrades gracefully instead of hammering providers.
 */
import type { ProviderUsage } from '../shared/types.ts';
import { db } from './db.ts';

export class BudgetError extends Error {
  constructor(provider: string, window: string) {
    super(`${provider} free-tier request budget reached (${window}) — serving cached data`);
  }
}

interface Budget {
  /** conservative caps; null = unlimited on that window */
  perMinute: number | null;
  perDay: number | null;
}

/** Published free-tier limits → conservative budgets. */
const BUDGETS: Record<string, Budget> = {
  yahoo: { perMinute: 60, perDay: null }, // unofficial: self-imposed politeness cap
  finnhub: { perMinute: 50, perDay: null }, // published 60/min
  alphavantage: { perMinute: 4, perDay: 20 }, // published 5/min, 25/day
  marketaux: { perMinute: 10, perDay: 90 }, // published 100/day
  fred: { perMinute: 60, perDay: null }, // generous; stay polite
  edgar: { perMinute: 240, perDay: null }, // SEC fair-access is 10 req/sec
};

function countSince(provider: string, sinceMs: number): number {
  const row = db
    .prepare('SELECT COUNT(*) AS n FROM request_log WHERE provider = ? AND ts >= ?')
    .get(provider, sinceMs) as { n: number };
  return row.n;
}

/**
 * Record + enforce one outbound request. Call immediately before fetching.
 * Throws BudgetError when a budget window is exhausted.
 */
export function spendRequest(provider: string): void {
  const b = BUDGETS[provider];
  const now = Date.now();
  if (b) {
    if (b.perMinute !== null && countSince(provider, now - 60_000) >= b.perMinute) {
      throw new BudgetError(provider, 'per-minute');
    }
    if (b.perDay !== null && countSince(provider, now - 86_400_000) >= b.perDay) {
      throw new BudgetError(provider, 'per-day');
    }
  }
  db.prepare('INSERT INTO request_log (provider, ts) VALUES (?, ?)').run(provider, now);
  // Cheap opportunistic prune (~1% of calls): drop entries older than 7 days.
  if (now % 100 < 1) {
    db.prepare('DELETE FROM request_log WHERE ts < ?').run(now - 7 * 86_400_000);
  }
}

export function usageReport(): ProviderUsage[] {
  const now = Date.now();
  return Object.entries(BUDGETS).map(([provider, b]) => ({
    provider,
    lastMinute: countSince(provider, now - 60_000),
    lastHour: countSince(provider, now - 3_600_000),
    today: countSince(provider, now - 86_400_000),
    perMinuteLimit: b.perMinute,
    perDayLimit: b.perDay,
  }));
}
