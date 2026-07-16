/**
 * DTOs shared by server and client. The server wraps every data payload in
 * an Envelope so the UI can always show source, freshness and demo labeling
 * (CLAUDE.md: label delayed vs real-time honestly; demo data clearly marked).
 */

/**
 * Data freshness tier. NEVER claim 'realtime' unless the payload actually
 * came from a live feed (e.g. websocket trades). 'official' = regulatory
 * source (SEC/Fed) — authoritative but published on a filing cadence.
 */
export type Freshness = 'realtime' | 'near-realtime' | 'delayed' | 'eod' | 'official' | 'synthetic';

export interface Envelope<T> {
  data: T;
  /** Provider id, e.g. 'yahoo', 'demo' */
  source: string;
  /** ISO timestamp the payload was fetched/generated */
  asOf: string;
  /** Provider-level: data may lag real time (kept for back-compat; see freshness) */
  delayed: boolean;
  freshness: Freshness;
  fromCache: boolean;
  /** Served from an expired cache entry because a refresh failed */
  stale: boolean;
  /** Synthetic demo data — UI must label prominently */
  demo: boolean;
}

export type AssetClass =
  | 'equity'
  | 'etf'
  | 'index'
  | 'fx'
  | 'crypto'
  | 'commodity'
  | 'rate'
  | 'future'
  | 'other';

export interface SymbolInfo {
  symbol: string;
  name: string;
  exchange?: string;
  assetClass: AssetClass;
  currency?: string;
}

export interface Quote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePct: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  volume?: number;
  currency?: string;
  /** ISO timestamp of the quote itself */
  ts: string;
}

export interface Candle {
  /** ISO timestamp (bar start) */
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
}

export const RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'] as const;
export type Range = (typeof RANGES)[number];

export interface Series {
  symbol: string;
  range: Range;
  /** Bar interval label, e.g. '5m', '1d', '1wk' */
  interval: string;
  currency?: string;
  candles: Candle[];
}

export interface NewsEntity {
  symbol: string;
  name?: string;
  /** -1..1 where negative is bearish, when the source provides it */
  sentiment?: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url?: string;
  publishedAt: string;
  symbols?: string[];
  /** Article-level sentiment -1..1, when the source provides it */
  sentiment?: number;
  /** Tagged entities with per-entity sentiment, when available */
  entities?: NewsEntity[];
  snippet?: string;
}

export interface EcoEvent {
  id: string;
  /** ISO timestamp of the release/meeting */
  time: string;
  region: string;
  event: string;
  /** 1 = low, 2 = medium, 3 = high impact */
  importance: 1 | 2 | 3;
  forecast?: string;
  previous?: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  kind: 'demo' | 'live';
  ready: boolean;
  capabilities: string[];
  delaySeconds: number;
  freshness: Freshness;
  note?: string;
}

export interface SettingsPayload {
  /** key -> value; secret values arrive masked (e.g. '••••abcd') */
  settings: Record<string, string>;
  providers: ProviderInfo[];
}

// ---------- analytics (Phase 4) ----------

export interface Fundamentals {
  symbol: string;
  name?: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  currency?: string;
  /** absolute USD (not millions) */
  marketCap?: number;
  peTTM?: number;
  epsTTM?: number;
  /** percent, e.g. 0.55 = 0.55% */
  dividendYield?: number;
  grossMarginTTM?: number;
  operatingMarginTTM?: number;
  netMarginTTM?: number;
  roeTTM?: number;
  debtToEquity?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
  week52ChangePct?: number;
}

export type StatementType = 'income' | 'balance' | 'cashflow';

export interface StatementPeriod {
  /** e.g. '2025-09-30' */
  period: string;
  /** keyed by line-item label; absolute currency units */
  values: Record<string, number | null>;
}

export type StatementPeriodicity = 'annual' | 'quarterly';

export interface Statements {
  symbol: string;
  type: StatementType;
  periodicity: StatementPeriodicity;
  currency?: string;
  /** ordered labels; every period.values is keyed by these */
  lineItems: string[];
  periods: StatementPeriod[];
}

// ---------- research content (Phase 8) ----------

export interface InsiderTx {
  name: string;
  /** signed share change: negative = disposal */
  change: number;
  sharesHeld?: number;
  price?: number;
  date: string;
  /** SEC transaction code, e.g. P (purchase), S (sale), A (award) */
  code?: string;
}

export interface RatingsPeriod {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface EarningsRow {
  period: string;
  epsActual: number | null;
  epsEstimate: number | null;
  surprisePct: number | null;
}

export interface EarningsEvent {
  symbol: string;
  date: string;
  /** bmo = before open, amc = after close */
  hour?: string;
  epsEstimate?: number;
  revenueEstimate?: number;
}

export interface IpoEvent {
  symbol?: string;
  name: string;
  date: string;
  exchange?: string;
  priceRange?: string;
  shares?: number;
  status?: string;
}

export interface DividendRow {
  /** period end / declaration date */
  date: string;
  /** per-share amount declared for the period */
  amount: number;
  currency?: string;
}

export interface HoldingRow {
  holder: string;
  shares?: number;
  value?: number;
  pctOut?: number;
  reportDate?: string;
}

export interface ShortInterestRow {
  date: string;
  shortInterest?: number;
  pctFloat?: number;
  daysToCover?: number;
}

export interface ProviderUsage {
  provider: string;
  lastMinute: number;
  lastHour: number;
  today: number;
  perMinuteLimit: number | null;
  perDayLimit: number | null;
}

// ---------- persisted workspace objects (Phase 3) ----------

export interface WatchlistItem {
  id: number;
  symbol: string;
  name: string | null;
  position: number;
  addedAt: string;
}

export interface Watchlist {
  id: number;
  name: string;
  createdAt: string;
  items: WatchlistItem[];
}

export interface Note {
  id: number;
  symbol: string | null;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type AlertCondition = 'above' | 'below';
export type AlertStatus = 'active' | 'triggered' | 'dismissed';

/** Price alerts notify only — they never place, route or simulate orders. */
export interface Alert {
  id: number;
  symbol: string;
  condition: AlertCondition;
  level: number;
  note: string | null;
  status: AlertStatus;
  createdAt: string;
  triggeredAt: string | null;
  triggeredPrice: number | null;
}
