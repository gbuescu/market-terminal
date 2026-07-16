/**
 * marketaux adapter — financial news with entity tagging and sentiment.
 * Activates when key.marketaux is saved in Settings or MKT_KEY_MARKETAUX.
 * Free tier: 100 requests/day, 3 articles per response — budgeted at 90/day
 * and cached hard (route TTLs), so a day of normal use stays inside quota.
 * NOTE: untested without a key on the dev machine; verify on first live use.
 */
import type { NewsItem } from '../../shared/types.ts';
import { spendRequest } from '../budget.ts';
import { getSetting } from '../settings.ts';
import type { Provider } from './types.ts';

const BASE = 'https://api.marketaux.com/v1/news/all';

function key(): string | null {
  return getSetting('key.marketaux');
}

interface MarketauxArticle {
  uuid?: string;
  title?: string;
  source?: string;
  url?: string;
  published_at?: string;
  snippet?: string;
  entities?: {
    symbol?: string;
    name?: string;
    sentiment_score?: number | null;
  }[];
}

export const marketauxProvider: Provider = {
  id: 'marketaux',
  name: 'marketaux',
  kind: 'live',
  delaySeconds: 300,
  freshness: 'near-realtime',
  note: 'News with entity tagging + sentiment. Free tier: 100 req/day, 3 articles/response — cached aggressively. Requires API key (SET).',
  ready: () => key() !== null,
  capabilities: ['news'],

  news: async (symbol?: string): Promise<NewsItem[]> => {
    const k = key();
    if (!k) throw new Error('marketaux API key not configured');
    spendRequest('marketaux');
    const params = new URLSearchParams({
      api_token: k,
      language: 'en',
      filter_entities: 'true',
      limit: '3', // free-tier max per response
    });
    if (symbol) params.set('symbols', symbol);
    const res = await fetch(`${BASE}?${params}`, { signal: AbortSignal.timeout(10_000) });
    if (res.status === 429) throw new Error('marketaux rate limit hit');
    if (!res.ok) throw new Error(`marketaux HTTP ${res.status}`);
    const json = (await res.json()) as { data?: MarketauxArticle[] };
    const articles = json.data ?? [];
    if (articles.length === 0) throw new Error(symbol ? `no news for ${symbol}` : 'no news');
    return articles.map((a, i) => {
      const entities = (a.entities ?? [])
        .filter((e) => e.symbol)
        .map((e) => ({
          symbol: (e.symbol as string).toUpperCase(),
          name: e.name,
          sentiment: typeof e.sentiment_score === 'number' ? e.sentiment_score : undefined,
        }));
      const scores = entities.map((e) => e.sentiment).filter((s): s is number => s !== undefined);
      return {
        id: a.uuid ?? `mx-${i}`,
        headline: a.title ?? '(untitled)',
        source: a.source ?? 'marketaux',
        url: a.url,
        publishedAt: a.published_at ?? new Date().toISOString(),
        symbols: entities.map((e) => e.symbol),
        sentiment: scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : undefined,
        entities,
        snippet: a.snippet,
      };
    });
  },
};
