/**
 * Finnhub adapter — activates when key.finnhub is saved in Settings
 * (free tier: 60 req/min). Capabilities: fundamentals (metric + profile2)
 * and US quotes. Not selected automatically without a key (ready() false).
 */
import type { Fundamentals, Quote } from '../../shared/types.ts';
import { getSetting } from '../settings.ts';
import type { Provider } from './types.ts';

const BASE = 'https://finnhub.io/api/v1';

function key(): string | null {
  return getSetting('key.finnhub');
}

async function getJson(path: string): Promise<unknown> {
  const k = key();
  if (!k) throw new Error('finnhub API key not configured');
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}token=${encodeURIComponent(k)}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 429) throw new Error('finnhub rate limit hit — try again shortly');
  if (!res.ok) throw new Error(`finnhub HTTP ${res.status}`);
  return res.json();
}

interface MetricResponse {
  metric?: Record<string, number | null | undefined>;
}

interface Profile2 {
  name?: string;
  exchange?: string;
  finnhubIndustry?: string;
  currency?: string;
  marketCapitalization?: number; // millions
}

const num = (v: number | null | undefined): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

export const finnhubProvider: Provider = {
  id: 'finnhub',
  name: 'Finnhub',
  kind: 'live',
  delaySeconds: 0,
  note: 'Free tier, 60 req/min. US-focused. Requires API key (SET).',
  ready: () => key() !== null,
  capabilities: ['quotes', 'fundamentals'],

  quotes: async (symbols: string[]): Promise<Quote[]> => {
    const settled = await Promise.allSettled(
      symbols.map(async (symbol): Promise<Quote> => {
        const q = (await getJson(`/quote?symbol=${encodeURIComponent(symbol)}`)) as {
          c?: number;
          d?: number;
          dp?: number;
          h?: number;
          l?: number;
          o?: number;
          pc?: number;
          t?: number;
        };
        if (!q.c) throw new Error(`no price for ${symbol}`);
        return {
          symbol,
          price: q.c,
          change: q.d ?? 0,
          changePct: q.dp ?? 0,
          open: num(q.o),
          high: num(q.h),
          low: num(q.l),
          prevClose: num(q.pc),
          ts: q.t ? new Date(q.t * 1000).toISOString() : new Date().toISOString(),
        };
      }),
    );
    const ok = settled
      .filter((r): r is PromiseFulfilledResult<Quote> => r.status === 'fulfilled')
      .map((r) => r.value);
    if (ok.length === 0 && symbols.length > 0) {
      const first = settled[0];
      throw new Error(first.status === 'rejected' ? String(first.reason) : 'no quotes');
    }
    return ok;
  },

  fundamentals: async (symbol: string): Promise<Fundamentals> => {
    const [metricRes, profile] = await Promise.all([
      getJson(
        `/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`,
      ) as Promise<MetricResponse>,
      getJson(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`) as Promise<Profile2>,
    ]);
    const m = metricRes.metric ?? {};
    if (!profile.name && Object.keys(m).length === 0) {
      throw new Error(`no fundamentals for ${symbol}`);
    }
    return {
      symbol,
      name: profile.name,
      exchange: profile.exchange,
      industry: profile.finnhubIndustry,
      currency: profile.currency,
      marketCap: profile.marketCapitalization
        ? Math.round(profile.marketCapitalization * 1e6)
        : undefined,
      peTTM: num(m.peTTM),
      epsTTM: num(m.epsTTM),
      dividendYield: num(m.dividendYieldIndicatedAnnual),
      grossMarginTTM: num(m.grossMarginTTM),
      operatingMarginTTM: num(m.operatingMarginTTM),
      netMarginTTM: num(m.netProfitMarginTTM),
      roeTTM: num(m.roeTTM),
      debtToEquity: num(m['totalDebt/totalEquityQuarterly']),
      beta: num(m.beta),
      week52High: num(m['52WeekHigh']),
      week52Low: num(m['52WeekLow']),
      week52ChangePct: num(m['52WeekPriceReturnDaily']),
    };
  },
};
