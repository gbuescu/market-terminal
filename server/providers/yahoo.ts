/**
 * Yahoo Finance adapter — UNOFFICIAL public endpoints, no API key.
 * Caveats (documented in docs/DATA_PROVIDERS.md): undocumented API that can
 * change or rate-limit at any time; quotes may be delayed up to ~15 minutes
 * depending on the exchange, so everything is labeled delayed. Not official
 * Bloomberg (or Yahoo-partner) data.
 */
import type {
  AssetClass,
  Candle,
  NewsItem,
  Quote,
  Range,
  Series,
  SymbolInfo,
} from '../../shared/types.ts';
import { type Provider, Unsupported } from './types.ts';

const BASE = 'https://query1.finance.yahoo.com';
const HEADERS = {
  // Some Yahoo edges reject default fetch agents.
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Accept: 'application/json',
};

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`yahoo HTTP ${res.status}`);
  return res.json();
}

const RANGE_MAP: Record<Range, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  YTD: { range: 'ytd', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
  MAX: { range: 'max', interval: '1mo' },
};

interface ChartResult {
  meta: {
    currency?: string;
    symbol: string;
    regularMarketPrice?: number;
    chartPreviousClose?: number;
    previousClose?: number;
    regularMarketTime?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketVolume?: number;
    shortName?: string;
    longName?: string;
  };
  timestamp?: number[];
  indicators?: {
    quote?: {
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }[];
  };
}

async function fetchChart(symbol: string, range: Range): Promise<ChartResult> {
  const m = RANGE_MAP[range];
  const url = `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${m.range}&interval=${m.interval}&includePrePost=false`;
  const json = (await getJson(url)) as {
    chart?: { result?: ChartResult[]; error?: { description?: string } | null };
  };
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(json.chart?.error?.description ?? `no data for ${symbol}`);
  return result;
}

function toQuote(r: ChartResult): Quote {
  const meta = r.meta;
  const price = meta.regularMarketPrice;
  if (price === undefined) throw new Error(`no price for ${meta.symbol}`);
  const prevClose = meta.chartPreviousClose ?? meta.previousClose;
  const change = prevClose !== undefined ? price - prevClose : 0;
  const q = r.indicators?.quote?.[0];
  const opens = (q?.open ?? []).filter((x): x is number => x != null);
  return {
    symbol: meta.symbol,
    name: meta.longName ?? meta.shortName,
    price,
    change,
    changePct: prevClose ? (change / prevClose) * 100 : 0,
    open: opens[0],
    high: meta.regularMarketDayHigh,
    low: meta.regularMarketDayLow,
    prevClose,
    volume: meta.regularMarketVolume,
    currency: meta.currency,
    ts: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString(),
  };
}

const ASSET_CLASS: Record<string, AssetClass> = {
  EQUITY: 'equity',
  ETF: 'etf',
  INDEX: 'index',
  CURRENCY: 'fx',
  CRYPTOCURRENCY: 'crypto',
  FUTURE: 'future',
  MUTUALFUND: 'other',
  OPTION: 'other',
};

export const yahooProvider: Provider = {
  id: 'yahoo',
  name: 'Yahoo Finance (unofficial)',
  kind: 'live',
  delaySeconds: 900,
  note: 'Undocumented public API; quotes delayed up to ~15 min depending on exchange; may break or rate-limit.',
  ready: () => true,
  capabilities: ['search', 'quotes', 'series', 'news'],

  search: async (query: string): Promise<SymbolInfo[]> => {
    const url = `${BASE}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
    const json = (await getJson(url)) as {
      quotes?: {
        symbol?: string;
        shortname?: string;
        longname?: string;
        exchDisp?: string;
        quoteType?: string;
      }[];
    };
    return (json.quotes ?? [])
      .filter((q) => q.symbol)
      .map((q) => ({
        symbol: (q.symbol as string).toUpperCase(),
        name: q.longname ?? q.shortname ?? (q.symbol as string),
        exchange: q.exchDisp,
        assetClass: ASSET_CLASS[q.quoteType ?? ''] ?? 'other',
      }));
  },

  quotes: async (symbols: string[]): Promise<Quote[]> => {
    const settled = await Promise.allSettled(
      symbols.map(async (s) => toQuote(await fetchChart(s, '1D'))),
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

  series: async (symbol: string, range: Range): Promise<Series> => {
    const r = await fetchChart(symbol, range);
    const q = r.indicators?.quote?.[0];
    const ts = r.timestamp ?? [];
    const candles: Candle[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = q?.close?.[i];
      if (c == null) continue;
      candles.push({
        t: new Date(ts[i] * 1000).toISOString(),
        o: q?.open?.[i] ?? c,
        h: q?.high?.[i] ?? c,
        l: q?.low?.[i] ?? c,
        c,
        v: q?.volume?.[i] ?? undefined,
      });
    }
    if (candles.length === 0) throw new Error(`empty series for ${symbol}`);
    return {
      symbol: r.meta.symbol,
      range,
      interval: RANGE_MAP[range].interval,
      currency: r.meta.currency,
      candles,
    };
  },

  news: async (symbol?: string): Promise<NewsItem[]> => {
    // Yahoo's search endpoint only returns news for a concrete query;
    // market-wide news falls through to the next provider.
    if (!symbol) throw new Unsupported('yahoo news requires a symbol');
    const url = `${BASE}/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=10`;
    const json = (await getJson(url)) as {
      news?: {
        uuid?: string;
        title?: string;
        publisher?: string;
        link?: string;
        providerPublishTime?: number;
      }[];
    };
    return (json.news ?? [])
      .filter((n) => n.title)
      .map((n, i) => ({
        id: n.uuid ?? `yahoo-${symbol}-${i}`,
        headline: n.title as string,
        source: n.publisher ?? 'Yahoo Finance',
        url: n.link,
        publishedAt: n.providerPublishTime
          ? new Date(n.providerPublishTime * 1000).toISOString()
          : new Date().toISOString(),
        symbols: [symbol],
      }));
  },
};
