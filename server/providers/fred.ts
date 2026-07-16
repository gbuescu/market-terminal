/**
 * FRED (St. Louis Fed) adapter — official US economic release calendar.
 * Activates when key.fred is saved in Settings or MKT_KEY_FRED (keys are
 * free). Capability: calendar — upcoming release dates from
 * fred/releases/dates, importance-ranked for the majors.
 * NOTE: untested without a key on the dev machine; verify on first live use.
 */
import type { EcoEvent } from '../../shared/types.ts';
import { spendRequest } from '../budget.ts';
import { getSetting } from '../settings.ts';
import type { Provider } from './types.ts';

function key(): string | null {
  return getSetting('key.fred');
}

const HIGH_IMPACT =
  /employment situation|consumer price index|gross domestic product|fomc|personal income|producer price/i;
const MID_IMPACT =
  /retail|housing|industrial production|jolts|consumer sentiment|durable goods|trade/i;

export const fredProvider: Provider = {
  id: 'fred',
  name: 'FRED (St. Louis Fed)',
  kind: 'live',
  delaySeconds: 0,
  freshness: 'official',
  note: 'Official US economic release schedule. Free API key required (SET). US releases only.',
  ready: () => key() !== null,
  capabilities: ['calendar'],

  calendar: async (): Promise<EcoEvent[]> => {
    const k = key();
    if (!k) throw new Error('FRED API key not configured');
    spendRequest('fred');
    const today = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
    const params = new URLSearchParams({
      api_key: k,
      file_type: 'json',
      realtime_start: today,
      realtime_end: to,
      include_release_dates_with_no_data: 'true',
      sort_order: 'asc',
      limit: '200',
    });
    const res = await fetch(`https://api.stlouisfed.org/fred/releases/dates?${params}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`FRED HTTP ${res.status}`);
    const json = (await res.json()) as {
      release_dates?: { release_id?: number; release_name?: string; date?: string }[];
    };
    const rows = (json.release_dates ?? []).filter((r) => r.release_name && r.date);
    if (rows.length === 0) throw new Error('no upcoming FRED releases');
    return rows.slice(0, 60).map((r, i) => {
      const name = r.release_name as string;
      const importance: 1 | 2 | 3 = HIGH_IMPACT.test(name) ? 3 : MID_IMPACT.test(name) ? 2 : 1;
      return {
        id: `fred-${r.release_id ?? i}-${r.date}`,
        // FRED gives dates, not clock times; use start-of-day ET-ish marker.
        time: `${r.date}T13:30:00.000Z`,
        region: 'US',
        event: name,
        importance,
      };
    });
  },
};
