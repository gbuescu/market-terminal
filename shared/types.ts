/**
 * DTOs shared by server and client. The server wraps every data payload in
 * an Envelope so the UI can always show source, freshness and demo labeling
 * (CLAUDE.md: label delayed vs real-time honestly; demo data clearly marked).
 */

export interface Envelope<T> {
  data: T;
  /** Provider id, e.g. 'yahoo', 'demo' */
  source: string;
  /** ISO timestamp the payload was fetched/generated */
  asOf: string;
  /** Provider-level: data may lag real time */
  delayed: boolean;
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

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url?: string;
  publishedAt: string;
  symbols?: string[];
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
  note?: string;
}

export interface SettingsPayload {
  /** key -> value; secret values arrive masked (e.g. '••••abcd') */
  settings: Record<string, string>;
  providers: ProviderInfo[];
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
