/**
 * Demo provider — deterministic synthetic data so the terminal is fully
 * usable offline and with zero API keys. Every payload it produces is
 * marked demo=true by the envelope and labeled in the UI. Prices are a
 * seeded random walk: stable within a 30-second bucket, drifting over time.
 */
import type {
  AssetClass,
  Candle,
  DividendRow,
  EarningsEvent,
  EarningsRow,
  EcoEvent,
  Fundamentals,
  HoldingRow,
  InsiderTx,
  IpoEvent,
  NewsItem,
  Quote,
  Range,
  RatingsPeriod,
  Series,
  ShortInterestRow,
  StatementPeriodicity,
  Statements,
  StatementType,
  SymbolInfo,
} from '../../shared/types.ts';
import type { Provider } from './types.ts';

interface DemoSym {
  name: string;
  base: number;
  assetClass: AssetClass;
  currency: string;
  decimals?: number;
}

/** Yahoo-style symbols so the same monitor config works in demo and live. */
const UNIVERSE: Record<string, DemoSym> = {
  '^GSPC': { name: 'S&P 500', base: 6210, assetClass: 'index', currency: 'USD' },
  '^IXIC': { name: 'NASDAQ Composite', base: 20350, assetClass: 'index', currency: 'USD' },
  '^DJI': { name: 'Dow Jones Industrial', base: 44480, assetClass: 'index', currency: 'USD' },
  '^FTSE': { name: 'FTSE 100', base: 8920, assetClass: 'index', currency: 'GBP' },
  '^GDAXI': { name: 'DAX', base: 24080, assetClass: 'index', currency: 'EUR' },
  '^FCHI': { name: 'CAC 40', base: 7810, assetClass: 'index', currency: 'EUR' },
  '^N225': { name: 'Nikkei 225', base: 39750, assetClass: 'index', currency: 'JPY' },
  '^HSI': { name: 'Hang Seng', base: 24120, assetClass: 'index', currency: 'HKD' },
  '^AXJO': { name: 'S&P/ASX 200', base: 8590, assetClass: 'index', currency: 'AUD' },
  'EURUSD=X': { name: 'EUR/USD', base: 1.171, assetClass: 'fx', currency: 'USD', decimals: 4 },
  'GBPUSD=X': { name: 'GBP/USD', base: 1.357, assetClass: 'fx', currency: 'USD', decimals: 4 },
  'JPY=X': { name: 'USD/JPY', base: 147.2, assetClass: 'fx', currency: 'JPY', decimals: 3 },
  '^TNX': {
    name: 'US 10Y Treasury Yield',
    base: 4.38,
    assetClass: 'rate',
    currency: 'USD',
    decimals: 3,
  },
  '^FVX': {
    name: 'US 5Y Treasury Yield',
    base: 3.98,
    assetClass: 'rate',
    currency: 'USD',
    decimals: 3,
  },
  '^TYX': {
    name: 'US 30Y Treasury Yield',
    base: 4.92,
    assetClass: 'rate',
    currency: 'USD',
    decimals: 3,
  },
  'GC=F': { name: 'Gold Futures', base: 3355, assetClass: 'commodity', currency: 'USD' },
  'CL=F': { name: 'WTI Crude Futures', base: 68.4, assetClass: 'commodity', currency: 'USD' },
  'BZ=F': { name: 'Brent Crude Futures', base: 70.1, assetClass: 'commodity', currency: 'USD' },
  'BTC-USD': { name: 'Bitcoin / USD', base: 117800, assetClass: 'crypto', currency: 'USD' },
  'ETH-USD': { name: 'Ethereum / USD', base: 3410, assetClass: 'crypto', currency: 'USD' },
  AAPL: { name: 'Apple Inc.', base: 212.4, assetClass: 'equity', currency: 'USD' },
  MSFT: { name: 'Microsoft Corp.', base: 502.1, assetClass: 'equity', currency: 'USD' },
  NVDA: { name: 'NVIDIA Corp.', base: 165.8, assetClass: 'equity', currency: 'USD' },
  AMZN: { name: 'Amazon.com Inc.', base: 226.3, assetClass: 'equity', currency: 'USD' },
  GOOGL: { name: 'Alphabet Inc. A', base: 181.7, assetClass: 'equity', currency: 'USD' },
  META: { name: 'Meta Platforms Inc.', base: 722.5, assetClass: 'equity', currency: 'USD' },
  TSLA: { name: 'Tesla Inc.', base: 312.9, assetClass: 'equity', currency: 'USD' },
  JPM: { name: 'JPMorgan Chase & Co.', base: 289.6, assetClass: 'equity', currency: 'USD' },
  XOM: { name: 'Exxon Mobil Corp.', base: 113.2, assetClass: 'equity', currency: 'USD' },
  SPY: { name: 'SPDR S&P 500 ETF', base: 619.8, assetClass: 'etf', currency: 'USD' },
  QQQ: { name: 'Invesco QQQ Trust', base: 554.6, assetClass: 'etf', currency: 'USD' },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small deterministic PRNG. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lookup(symbol: string): DemoSym {
  return (
    UNIVERSE[symbol] ?? {
      name: symbol,
      base: 20 + (hash(symbol) % 500),
      assetClass: 'other',
      currency: 'USD',
    }
  );
}

function round(x: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
}

/** Deterministic walk value in [-1, 1] for a symbol at a time bucket. */
function walk(symbol: string, bucket: number): number {
  const r = rng(hash(symbol) ^ bucket);
  return r() * 2 - 1;
}

function demoPrice(symbol: string, at: number): number {
  const s = lookup(symbol);
  const day = Math.floor(at / 86_400_000);
  const bucket30s = Math.floor(at / 30_000);
  // Day-level drift ±1.5% plus intra-30s jitter ±0.3%.
  const drift = walk(symbol, day) * 0.015;
  const jitter = walk(symbol, bucket30s) * 0.003;
  return s.base * (1 + drift + jitter);
}

function demoQuote(symbol: string): Quote {
  const s = lookup(symbol);
  const now = Date.now();
  const d = s.decimals ?? 2;
  const price = round(demoPrice(symbol, now), d);
  const prevClose = round(s.base * (1 + walk(symbol, Math.floor(now / 86_400_000) - 1) * 0.015), d);
  const change = round(price - prevClose, d);
  const dayHigh = round(Math.max(price, prevClose) * 1.004, d);
  const dayLow = round(Math.min(price, prevClose) * 0.996, d);
  return {
    symbol,
    name: s.name,
    price,
    change,
    changePct: round((change / prevClose) * 100, 2),
    open: round(prevClose * (1 + walk(symbol, Math.floor(now / 86_400_000)) * 0.004), d),
    high: dayHigh,
    low: dayLow,
    prevClose,
    volume:
      s.assetClass === 'equity' ? Math.floor(2e7 + 4e7 * ((hash(symbol) % 100) / 100)) : undefined,
    currency: s.currency,
    ts: new Date(now).toISOString(),
  };
}

const RANGE_SHAPE: Record<Range, { bars: number; stepMs: number; interval: string }> = {
  '1D': { bars: 78, stepMs: 5 * 60_000, interval: '5m' },
  '5D': { bars: 130, stepMs: 30 * 60_000, interval: '30m' },
  '1M': { bars: 22, stepMs: 86_400_000, interval: '1d' },
  '6M': { bars: 128, stepMs: 86_400_000, interval: '1d' },
  YTD: { bars: 134, stepMs: 86_400_000, interval: '1d' },
  '1Y': { bars: 252, stepMs: 86_400_000, interval: '1d' },
  '5Y': { bars: 260, stepMs: 7 * 86_400_000, interval: '1wk' },
  MAX: { bars: 120, stepMs: 30 * 86_400_000, interval: '1mo' },
};

function demoSeries(symbol: string, range: Range): Series {
  const s = lookup(symbol);
  const { bars, stepMs, interval } = RANGE_SHAPE[range];
  const d = s.decimals ?? 2;
  const now = Date.now();
  const r = rng(hash(`${symbol}:${range}`));
  const vol = 0.008 * Math.sqrt(stepMs / 86_400_000 + 0.05);
  // Walk backwards from the current demo price so ranges agree with quotes.
  let price = demoPrice(symbol, now);
  const candles: Candle[] = [];
  for (let i = 0; i < bars; i++) {
    const t = now - i * stepMs;
    const move = (r() * 2 - 1) * vol * price;
    const o = price - move;
    const hi = Math.max(o, price) * (1 + r() * vol * 0.4);
    const lo = Math.min(o, price) * (1 - r() * vol * 0.4);
    candles.push({
      t: new Date(t).toISOString(),
      o: round(o, d),
      h: round(hi, d),
      l: round(lo, d),
      c: round(price, d),
      v: s.assetClass === 'equity' ? Math.floor(1e6 + r() * 5e6) : undefined,
    });
    price = o;
  }
  candles.reverse();
  return { symbol, range, interval, currency: s.currency, candles };
}

const HEADLINES = [
  ['Futures steady as traders weigh rate path', 'DEMO WIRE'],
  ['{SYM} shares in focus after analyst note', 'DEMO WIRE'],
  ['Dollar drifts ahead of macro data deluge', 'DEMO DAILY'],
  ['{SYM} volatility picks up into earnings season', 'DEMO DAILY'],
  ['Oil slips on supply outlook; gold holds range', 'DEMO WIRE'],
  ['Chipmakers extend rally on AI capex optimism', 'DEMO TECH'],
  ['{SYM} options activity signals hedging demand', 'DEMO DERIV'],
  ['Treasury yields ease after auction demand improves', 'DEMO RATES'],
  ['European equities mixed as earnings roll in', 'DEMO EU'],
  ['Crypto steadies after weekend swings', 'DEMO DIGITAL'],
] as const;

function demoNews(symbol?: string): NewsItem[] {
  const now = Date.now();
  const day = Math.floor(now / 86_400_000);
  const sym = symbol ?? 'MARKET';
  return HEADLINES.map(([tpl, source], i) => ({
    id: `demo-${day}-${sym}-${i}`,
    headline: tpl.replace('{SYM}', symbol ?? 'Equities'),
    source,
    publishedAt: new Date(now - (i + 1) * 47 * 60_000).toISOString(),
    symbols: symbol ? [symbol] : undefined,
  })).filter((item) => (symbol ? true : !item.headline.includes(sym)));
}

const ECO_TEMPLATE: [number, string, string, 1 | 2 | 3, string?, string?][] = [
  [0.35, 'US', 'CPI YoY', 3, '2.6%', '2.7%'],
  [0.55, 'EU', 'ECB Rate Decision', 3, '2.00%', '2.00%'],
  [1.35, 'US', 'Initial Jobless Claims', 2, '232k', '228k'],
  [1.6, 'UK', 'GDP MoM', 2, '0.1%', '-0.1%'],
  [2.4, 'US', 'Retail Sales MoM', 2, '0.3%', '0.2%'],
  [2.55, 'JP', 'BoJ Policy Statement', 3, undefined, undefined],
  [3.4, 'DE', 'ZEW Economic Sentiment', 1, '48.0', '47.5'],
  [4.35, 'US', 'Nonfarm Payrolls', 3, '145k', '139k'],
  [4.5, 'US', 'Unemployment Rate', 3, '4.2%', '4.2%'],
  [5.3, 'CN', 'Trade Balance', 2, '$97B', '$103B'],
];

function demoCalendar(): EcoEvent[] {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const base = dayStart.getTime();
  return ECO_TEMPLATE.map(([dayOffset, region, event, importance, forecast, previous], i) => ({
    id: `demo-eco-${base}-${i}`,
    time: new Date(base + dayOffset * 86_400_000 + 8.5 * 3_600_000).toISOString(),
    region,
    event,
    importance,
    forecast,
    previous,
  }));
}

const SECTORS: Record<string, [string, string]> = {
  AAPL: ['Technology', 'Consumer Electronics'],
  MSFT: ['Technology', 'Software'],
  NVDA: ['Technology', 'Semiconductors'],
  AMZN: ['Consumer Cyclical', 'Internet Retail'],
  GOOGL: ['Communication Services', 'Internet Content'],
  META: ['Communication Services', 'Internet Content'],
  TSLA: ['Consumer Cyclical', 'Auto Manufacturers'],
  JPM: ['Financial Services', 'Banks'],
  XOM: ['Energy', 'Oil & Gas Integrated'],
};

function pick(r: () => number, lo: number, hi: number, decimals = 2): number {
  return round(lo + r() * (hi - lo), decimals);
}

function demoFundamentals(symbol: string): Fundamentals {
  const s = lookup(symbol);
  const r = rng(hash(`${symbol}:fundamentals`));
  const [sector, industry] = SECTORS[symbol] ?? ['Technology', 'Diversified'];
  const shares = 0.5e9 + r() * 15e9;
  const price = demoPrice(symbol, Date.now());
  const netMargin = pick(r, 5, 32);
  const isPayer = r() > 0.45;
  return {
    symbol,
    name: s.name,
    exchange: 'DEMO',
    sector,
    industry,
    currency: s.currency,
    marketCap: Math.round(price * shares),
    peTTM: pick(r, 9, 44, 1),
    epsTTM: round(price / pick(r, 9, 44, 1), 2),
    dividendYield: isPayer ? pick(r, 0.3, 3.8) : 0,
    grossMarginTTM: pick(r, 25, 70, 1),
    operatingMarginTTM: pick(r, 8, 40, 1),
    netMarginTTM: netMargin,
    roeTTM: pick(r, 6, 45, 1),
    debtToEquity: pick(r, 0.1, 1.9),
    beta: pick(r, 0.6, 1.9),
    week52High: round(price * (1 + pick(r, 0.05, 0.35)), 2),
    week52Low: round(price * (1 - pick(r, 0.08, 0.4)), 2),
    week52ChangePct: pick(r, -30, 55, 1),
  };
}

const STATEMENT_ITEMS: Record<StatementType, string[]> = {
  income: ['Revenue', 'Gross Profit', 'Operating Income', 'Net Income'],
  balance: [
    'Total Assets',
    'Total Liabilities',
    'Shareholder Equity',
    'Cash & Equivalents',
    'Long-Term Debt',
  ],
  cashflow: ['Operating Cash Flow', 'Capital Expenditure', 'Free Cash Flow', 'Dividends Paid'],
};

function demoStatements(
  symbol: string,
  type: StatementType,
  periodicity: StatementPeriodicity,
): Statements {
  const s = lookup(symbol);
  const r = rng(hash(`${symbol}:statements:${periodicity}`));
  const f = demoFundamentals(symbol);
  const annualRev = (f.marketCap ?? 5e10) * pick(r, 0.15, 0.6);
  const revenue0 = periodicity === 'annual' ? annualRev : annualRev / 4;
  const growth = pick(r, 0.03, 0.16, 3) / (periodicity === 'annual' ? 1 : 4);
  const year = new Date().getFullYear();
  const backs = periodicity === 'annual' ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5, 6, 7];
  const periods = backs.map((back) => {
    const rev = revenue0 / (1 + growth) ** back;
    const gross = rev * ((f.grossMarginTTM ?? 40) / 100) * pick(r, 0.96, 1.04);
    const op = rev * ((f.operatingMarginTTM ?? 20) / 100) * pick(r, 0.94, 1.06);
    const net = rev * ((f.netMarginTTM ?? 15) / 100) * pick(r, 0.93, 1.07);
    const assets = rev * pick(r, 1.2, 2.4);
    const liabilities = assets * pick(r, 0.4, 0.7);
    const opCF = net * pick(r, 1.05, 1.4);
    const capex = rev * pick(r, 0.03, 0.09);
    let values: Record<string, number | null>;
    if (type === 'income') {
      values = {
        Revenue: Math.round(rev),
        'Gross Profit': Math.round(gross),
        'Operating Income': Math.round(op),
        'Net Income': Math.round(net),
      };
    } else if (type === 'balance') {
      values = {
        'Total Assets': Math.round(assets),
        'Total Liabilities': Math.round(liabilities),
        'Shareholder Equity': Math.round(assets - liabilities),
        'Cash & Equivalents': Math.round(assets * pick(r, 0.05, 0.2)),
        'Long-Term Debt': Math.round(assets * pick(r, 0.1, 0.3)),
      };
    } else {
      values = {
        'Operating Cash Flow': Math.round(opCF),
        'Capital Expenditure': -Math.round(capex),
        'Free Cash Flow': Math.round(opCF - capex),
        'Dividends Paid': f.dividendYield ? -Math.round(net * pick(r, 0.15, 0.5)) : 0,
      };
    }
    if (periodicity === 'annual') return { period: `${year - 1 - back}-12-31`, values };
    const q = new Date();
    q.setMonth(q.getMonth() - 3 * (back + 1));
    return { period: q.toISOString().slice(0, 10), values };
  });
  return {
    symbol,
    type,
    periodicity,
    currency: s.currency,
    lineItems: STATEMENT_ITEMS[type],
    periods,
  };
}

// ---------- research content (Phase 8) ----------

const INSIDER_NAMES = [
  'Cook Timothy D',
  'Rivera Elena',
  'Okafor Chidi',
  'Lindqvist Maja',
  'Tanaka Hiro',
  'Meyer Johannes',
];
const TX_CODES = ['P', 'S', 'S', 'A', 'S', 'P'] as const;

function demoInsiders(symbol: string): InsiderTx[] {
  const r = rng(hash(`${symbol}:insiders`));
  const price = demoPrice(symbol, Date.now());
  return INSIDER_NAMES.map((name, i) => {
    const daysAgo = Math.floor(pick(r, 3, 120, 0));
    const code = TX_CODES[i];
    const magnitude = Math.floor(pick(r, 2_000, 120_000, 0));
    return {
      name,
      change: code === 'S' ? -magnitude : magnitude,
      sharesHeld: Math.floor(pick(r, 50_000, 3_000_000, 0)),
      price: round(price * pick(r, 0.85, 1.1), 2),
      date: new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10),
      code,
    };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function demoRatings(symbol: string): RatingsPeriod[] {
  const r = rng(hash(`${symbol}:ratings`));
  const analysts = Math.floor(pick(r, 18, 45, 0));
  return [0, 1, 2, 3].map((back) => {
    const d = new Date();
    d.setMonth(d.getMonth() - back);
    const bullish = pick(r, 0.3, 0.7);
    const strongBuy = Math.floor(analysts * bullish * 0.4);
    const buy = Math.floor(analysts * bullish * 0.6);
    const sell = Math.floor(analysts * (1 - bullish) * 0.25);
    const strongSell = Math.floor(analysts * (1 - bullish) * 0.08);
    return {
      period: `${d.toISOString().slice(0, 7)}-01`,
      strongBuy,
      buy,
      hold: Math.max(0, analysts - strongBuy - buy - sell - strongSell),
      sell,
      strongSell,
    };
  });
}

function demoEarnings(symbol: string): EarningsRow[] {
  const r = rng(hash(`${symbol}:earnings`));
  const baseEps = pick(r, 0.4, 4.5);
  return [0, 1, 2, 3, 4, 5, 6, 7].map((back) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3 * (back + 1));
    const estimate = round(baseEps * (1 - back * 0.02) * pick(r, 0.95, 1.05), 2);
    const surprise = pick(r, -8, 12, 1);
    return {
      period: d.toISOString().slice(0, 10),
      epsActual: round(estimate * (1 + surprise / 100), 2),
      epsEstimate: estimate,
      surprisePct: surprise,
    };
  });
}

function demoEarningsCalendar(): EarningsEvent[] {
  const syms = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'JPM', 'XOM', 'ORCL'];
  return syms.map((symbol, i) => {
    const r = rng(hash(`${symbol}:erncal`));
    return {
      symbol,
      date: new Date(Date.now() + (i + 1) * 86_400_000).toISOString().slice(0, 10),
      hour: i % 2 === 0 ? 'amc' : 'bmo',
      epsEstimate: pick(r, 0.5, 4, 2),
    };
  });
}

const IPO_NAMES = [
  ['Northwind Robotics', 'NWRB'],
  ['Helios Grid Storage', 'HGRD'],
  ['Bluewater Biologics', 'BLWB'],
  ['Quantfleet Logistics', 'QFLT'],
  ['Aster Materials', 'ASTM'],
] as const;

function demoIpoCalendar(): IpoEvent[] {
  return IPO_NAMES.map(([name, symbol], i) => {
    const r = rng(hash(`${symbol}:ipo`));
    const lo = pick(r, 12, 30, 0);
    return {
      symbol,
      name,
      date: new Date(Date.now() + (i * 4 + 2) * 86_400_000).toISOString().slice(0, 10),
      exchange: i % 2 === 0 ? 'NASDAQ' : 'NYSE',
      priceRange: `${lo}-${lo + 3}`,
      shares: Math.floor(pick(r, 5e6, 40e6, 0)),
      status: 'expected',
    };
  });
}

function demoDividends(symbol: string): DividendRow[] {
  const f = demoFundamentals(symbol);
  if (!f.dividendYield) throw new Error(`${symbol} pays no dividend (demo)`);
  const price = demoPrice(symbol, Date.now());
  const quarterly = (price * (f.dividendYield / 100)) / 4;
  return [0, 1, 2, 3, 4, 5, 6, 7].map((back) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3 * back - 1);
    const growthSteps = Math.floor(back / 4);
    return {
      date: d.toISOString().slice(0, 10),
      amount: round(quarterly / (1 + 0.06 * growthSteps) ** 1, 3),
      currency: 'USD',
    };
  });
}

const HOLDER_NAMES = [
  'Vanguard Group Inc',
  'BlackRock Inc',
  'State Street Corp',
  'Fidelity (FMR LLC)',
  'Geode Capital Management',
  'T. Rowe Price Associates',
];

function demoHoldings(symbol: string): HoldingRow[] {
  const r = rng(hash(`${symbol}:holdings`));
  const f = demoFundamentals(symbol);
  const cap = f.marketCap ?? 5e10;
  let pctLeft = pick(r, 55, 75);
  return HOLDER_NAMES.map((holder, i) => {
    const pct = round(pctLeft * pick(r, 0.15, 0.3), 2);
    pctLeft -= pct;
    const value = Math.round((cap * pct) / 100);
    const d = new Date();
    d.setMonth(d.getMonth() - ((i % 3) + 1));
    return {
      holder,
      value,
      pctOut: pct,
      shares: Math.floor(value / demoPrice(symbol, Date.now())),
      reportDate: d.toISOString().slice(0, 10),
    };
  });
}

function demoShortInterest(symbol: string): ShortInterestRow[] {
  const r = rng(hash(`${symbol}:short`));
  const base = pick(r, 0.8, 6);
  return [0, 1, 2, 3, 4, 5].map((back) => {
    const d = new Date();
    d.setDate(d.getDate() - back * 14 - 3);
    const pct = round(base * pick(r, 0.85, 1.15), 2);
    return {
      date: d.toISOString().slice(0, 10),
      pctFloat: pct,
      shortInterest: Math.floor(pick(r, 5e6, 90e6, 0)),
      daysToCover: round(pct * pick(r, 0.4, 1.2), 1),
    };
  });
}

export const demoProvider: Provider = {
  id: 'demo',
  name: 'Demo / seed data',
  kind: 'demo',
  delaySeconds: 0,
  freshness: 'synthetic',
  note: 'Synthetic deterministic data. Not real market data — for offline use and learning.',
  ready: () => true,
  capabilities: [
    'search',
    'quotes',
    'series',
    'news',
    'calendar',
    'fundamentals',
    'statements',
    'insiders',
    'ratings',
    'earnings',
    'earningscal',
    'ipo',
    'dividends',
    'holdings',
    'short',
  ],
  search: async (query: string): Promise<SymbolInfo[]> => {
    const q = query.trim().toUpperCase();
    return Object.entries(UNIVERSE)
      .filter(([sym, s]) => sym.includes(q) || s.name.toUpperCase().includes(q))
      .slice(0, 8)
      .map(([sym, s]) => ({
        symbol: sym,
        name: s.name,
        assetClass: s.assetClass,
        currency: s.currency,
        exchange: 'DEMO',
      }));
  },
  quotes: async (symbols: string[]) => symbols.map(demoQuote),
  series: async (symbol: string, range: Range) => demoSeries(symbol, range),
  news: async (symbol?: string) => demoNews(symbol),
  calendar: async () => demoCalendar(),
  fundamentals: async (symbol: string) => demoFundamentals(symbol),
  statements: async (symbol: string, type: StatementType, periodicity: StatementPeriodicity) =>
    demoStatements(symbol, type, periodicity),
  insiders: async (symbol: string) => demoInsiders(symbol),
  ratings: async (symbol: string) => demoRatings(symbol),
  earnings: async (symbol: string) => demoEarnings(symbol),
  earningsCalendar: async () => demoEarningsCalendar(),
  ipoCalendar: async () => demoIpoCalendar(),
  dividends: async (symbol: string) => demoDividends(symbol),
  holdings: async (symbol: string) => demoHoldings(symbol),
  shortInterest: async (symbol: string) => demoShortInterest(symbol),
};
