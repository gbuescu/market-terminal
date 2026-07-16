/**
 * Finnhub adapter — activates when key.finnhub is saved in Settings or the
 * MKT_KEY_FINNHUB env var (free tier: 60 req/min, budgeted at 50/min).
 * Capabilities: US quotes (REST + websocket live trades via livequotes.ts),
 * fundamentals, insider transactions, analyst recommendation trends,
 * earnings surprises, earnings calendar, IPO calendar.
 * Note: analyst PRICE TARGETS and short interest are premium on Finnhub —
 * deliberately not implemented; we never fake them.
 */
import type {
  EarningsEvent,
  EarningsRow,
  Fundamentals,
  InsiderTx,
  IpoEvent,
  Quote,
  RatingsPeriod,
} from '../../shared/types.ts';
import { spendRequest } from '../budget.ts';
import { getSetting } from '../settings.ts';
import { liveQuote, seedPrevClose, touchSymbols } from './livequotes.ts';
import type { Provider } from './types.ts';

const BASE = 'https://finnhub.io/api/v1';

export function finnhubKey(): string | null {
  return getSetting('key.finnhub');
}

async function getJson(path: string): Promise<unknown> {
  const k = finnhubKey();
  if (!k) throw new Error('finnhub API key not configured');
  spendRequest('finnhub');
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}token=${encodeURIComponent(k)}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 429) throw new Error('finnhub rate limit hit — try again shortly');
  if (!res.ok) throw new Error(`finnhub HTTP ${res.status}`);
  return res.json();
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  freshness: 'near-realtime',
  note: 'Free tier, 60 req/min (budgeted 50). US-focused. Websocket trades when subscribed. Requires API key (SET). Price targets/short interest are premium — not offered.',
  ready: () => finnhubKey() !== null,
  capabilities: ['quotes', 'fundamentals', 'insiders', 'ratings', 'earnings', 'earningscal', 'ipo'],

  quotes: async (symbols: string[]): Promise<Quote[]> => {
    // Keep these symbols on the websocket; serve ws-fresh trades without a
    // REST call when we have one from the last few seconds.
    touchSymbols(symbols);
    const settled = await Promise.allSettled(
      symbols.map(async (symbol): Promise<Quote> => {
        const live = liveQuote(symbol, 5_000);
        if (live) return live;
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
        if (typeof q.pc === 'number') seedPrevClose(symbol, q.pc);
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

  insiders: async (symbol: string): Promise<InsiderTx[]> => {
    const json = (await getJson(
      `/stock/insider-transactions?symbol=${encodeURIComponent(symbol)}`,
    )) as {
      data?: {
        name?: string;
        change?: number;
        share?: number;
        transactionPrice?: number;
        transactionDate?: string;
        transactionCode?: string;
      }[];
    };
    return (json.data ?? [])
      .filter((r) => r.name && r.transactionDate)
      .slice(0, 60)
      .map((r) => ({
        name: r.name as string,
        change: r.change ?? 0,
        sharesHeld: num(r.share),
        price: num(r.transactionPrice),
        date: r.transactionDate as string,
        code: r.transactionCode,
      }));
  },

  ratings: async (symbol: string): Promise<RatingsPeriod[]> => {
    const json = (await getJson(`/stock/recommendation?symbol=${encodeURIComponent(symbol)}`)) as {
      period?: string;
      strongBuy?: number;
      buy?: number;
      hold?: number;
      sell?: number;
      strongSell?: number;
    }[];
    if (!Array.isArray(json) || json.length === 0) throw new Error(`no ratings for ${symbol}`);
    return json.slice(0, 12).map((r) => ({
      period: r.period ?? 'unknown',
      strongBuy: r.strongBuy ?? 0,
      buy: r.buy ?? 0,
      hold: r.hold ?? 0,
      sell: r.sell ?? 0,
      strongSell: r.strongSell ?? 0,
    }));
  },

  earnings: async (symbol: string): Promise<EarningsRow[]> => {
    const json = (await getJson(
      `/stock/earnings?symbol=${encodeURIComponent(symbol)}&limit=12`,
    )) as {
      period?: string;
      actual?: number | null;
      estimate?: number | null;
      surprisePercent?: number | null;
    }[];
    if (!Array.isArray(json) || json.length === 0) throw new Error(`no earnings for ${symbol}`);
    return json.map((r) => ({
      period: r.period ?? 'unknown',
      epsActual: r.actual ?? null,
      epsEstimate: r.estimate ?? null,
      surprisePct: r.surprisePercent ?? null,
    }));
  },

  earningsCalendar: async (): Promise<EarningsEvent[]> => {
    const now = new Date();
    const to = new Date(now.getTime() + 14 * 86_400_000);
    const json = (await getJson(`/calendar/earnings?from=${isoDate(now)}&to=${isoDate(to)}`)) as {
      earningsCalendar?: {
        symbol?: string;
        date?: string;
        hour?: string;
        epsEstimate?: number | null;
        revenueEstimate?: number | null;
      }[];
    };
    return (json.earningsCalendar ?? [])
      .filter((r) => r.symbol && r.date)
      .slice(0, 120)
      .map((r) => ({
        symbol: r.symbol as string,
        date: r.date as string,
        hour: r.hour || undefined,
        epsEstimate: num(r.epsEstimate),
        revenueEstimate: num(r.revenueEstimate),
      }));
  },

  ipoCalendar: async (): Promise<IpoEvent[]> => {
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 86_400_000);
    const to = new Date(now.getTime() + 45 * 86_400_000);
    const json = (await getJson(`/calendar/ipo?from=${isoDate(from)}&to=${isoDate(to)}`)) as {
      ipoCalendar?: {
        symbol?: string;
        name?: string;
        date?: string;
        exchange?: string;
        price?: string;
        numberOfShares?: number;
        status?: string;
      }[];
    };
    return (json.ipoCalendar ?? [])
      .filter((r) => r.name && r.date)
      .slice(0, 80)
      .map((r) => ({
        symbol: r.symbol || undefined,
        name: r.name as string,
        date: r.date as string,
        exchange: r.exchange,
        priceRange: r.price || undefined,
        shares: num(r.numberOfShares),
        status: r.status,
      }));
  },
};
