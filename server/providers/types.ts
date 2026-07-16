import type {
  DividendRow,
  EarningsEvent,
  EarningsRow,
  EcoEvent,
  Freshness,
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

export type Capability =
  | 'search'
  | 'quotes'
  | 'series'
  | 'news'
  | 'calendar'
  | 'fundamentals'
  | 'statements'
  | 'insiders'
  | 'ratings'
  | 'earnings'
  | 'earningscal'
  | 'ipo'
  | 'dividends'
  | 'holdings'
  | 'short';

/**
 * Thrown by an adapter when it cannot serve a *shape* of request (e.g.
 * market-wide news from a per-symbol source). The registry falls through to
 * the next provider ONLY for Unsupported — never for network/data failures,
 * so live-data errors are surfaced instead of silently swapping in demo data.
 */
export class Unsupported extends Error {}

export interface Provider {
  id: string;
  name: string;
  kind: 'demo' | 'live';
  /** Typical data delay in seconds (0 = near-real-time). Used for labeling. */
  delaySeconds: number;
  /** Honest freshness tier shown in every DataBadge. */
  freshness: Freshness;
  note?: string;
  /** Whether the provider can serve right now (e.g. has its API key). */
  ready(): boolean;
  capabilities: readonly Capability[];
  search?(query: string): Promise<SymbolInfo[]>;
  quotes?(symbols: string[]): Promise<Quote[]>;
  series?(symbol: string, range: Range): Promise<Series>;
  news?(symbol?: string): Promise<NewsItem[]>;
  calendar?(): Promise<EcoEvent[]>;
  fundamentals?(symbol: string): Promise<Fundamentals>;
  statements?(
    symbol: string,
    type: StatementType,
    periodicity: StatementPeriodicity,
  ): Promise<Statements>;
  insiders?(symbol: string): Promise<InsiderTx[]>;
  ratings?(symbol: string): Promise<RatingsPeriod[]>;
  earnings?(symbol: string): Promise<EarningsRow[]>;
  earningsCalendar?(): Promise<EarningsEvent[]>;
  ipoCalendar?(): Promise<IpoEvent[]>;
  dividends?(symbol: string): Promise<DividendRow[]>;
  holdings?(symbol: string): Promise<HoldingRow[]>;
  shortInterest?(symbol: string): Promise<ShortInterestRow[]>;
}
