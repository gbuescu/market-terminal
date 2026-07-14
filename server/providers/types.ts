import type { EcoEvent, NewsItem, Quote, Range, Series, SymbolInfo } from '../../shared/types.ts';

export type Capability = 'search' | 'quotes' | 'series' | 'news' | 'calendar';

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
  note?: string;
  /** Whether the provider can serve right now (e.g. has its API key). */
  ready(): boolean;
  capabilities: readonly Capability[];
  search?(query: string): Promise<SymbolInfo[]>;
  quotes?(symbols: string[]): Promise<Quote[]>;
  series?(symbol: string, range: Range): Promise<Series>;
  news?(symbol?: string): Promise<NewsItem[]>;
  calendar?(): Promise<EcoEvent[]>;
}
