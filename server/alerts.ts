/**
 * Alert evaluation engine. Every 60s (and on demand via
 * POST /api/alerts/evaluate) it prices the symbols of active alerts through
 * the normal provider registry and marks crossed alerts as triggered.
 *
 * Alerts NOTIFY ONLY: triggering writes a status row that the UI displays.
 * Nothing here — or anywhere else — may ever act on a market.
 */
import { db } from './db.ts';
import { pickProviders } from './providers/registry.ts';

interface ActiveAlert {
  id: number;
  symbol: string;
  condition: 'above' | 'below';
  level: number;
}

export async function evaluateAlerts(): Promise<{ checked: number; triggered: number }> {
  const active = db
    .prepare("SELECT id, symbol, condition, level FROM alerts WHERE status = 'active'")
    .all() as unknown as ActiveAlert[];
  if (active.length === 0) return { checked: 0, triggered: 0 };

  const symbols = [...new Set(active.map((a) => a.symbol))].slice(0, 25);
  const provider = pickProviders('quotes').find((p) => p.quotes);
  if (!provider?.quotes) return { checked: 0, triggered: 0 };

  let quotes: Awaited<ReturnType<NonNullable<typeof provider.quotes>>>;
  try {
    quotes = await provider.quotes(symbols);
  } catch (err) {
    console.warn(`[alerts] evaluation skipped: ${err instanceof Error ? err.message : err}`);
    return { checked: 0, triggered: 0 };
  }

  const priceBySymbol = new Map(quotes.map((q) => [q.symbol, q.price]));
  const trigger = db.prepare(
    "UPDATE alerts SET status = 'triggered', triggered_at = datetime('now'), triggered_price = ? WHERE id = ? AND status = 'active'",
  );
  let triggered = 0;
  for (const a of active) {
    const price = priceBySymbol.get(a.symbol);
    if (price === undefined) continue;
    const crossed = a.condition === 'above' ? price >= a.level : price <= a.level;
    if (crossed) {
      trigger.run(price, a.id);
      triggered++;
      console.log(`[alerts] triggered #${a.id}: ${a.symbol} ${a.condition} ${a.level} @ ${price}`);
    }
  }
  return { checked: active.length, triggered };
}

export function startAlertEngine(intervalMs = 60_000): void {
  const tick = () => {
    evaluateAlerts().catch((err) => console.warn('[alerts] engine error:', err));
  };
  setTimeout(tick, 5_000); // first pass shortly after boot
  setInterval(tick, intervalMs);
}
