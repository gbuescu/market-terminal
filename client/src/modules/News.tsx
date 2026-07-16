import { useMemo, useState } from 'react';
import type { NewsItem } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtDateTime } from '../lib/format';
import type { Tab } from '../state/workspace';

/**
 * Keyword-based topic filters, applied client-side to headline+snippet so
 * they work uniformly across providers (marketaux/yahoo/demo). Honest and
 * transparent: this is text matching, not editorial tagging.
 */
const TOPICS: { id: string; label: string; re: RegExp }[] = [
  {
    id: 'macro',
    label: 'MACRO',
    re: /macro|inflation|cpi|gdp|jobs|payroll|unemployment|recession|pmi|econom|treasury|yield/i,
  },
  {
    id: 'earnings',
    label: 'EARNINGS',
    re: /earnings|revenue|profit|guidance|quarter|eps|outlook/i,
  },
  { id: 'ma', label: 'M&A', re: /merger|acquisition|acquire|takeover|buyout|deal|stake/i },
  {
    id: 'cb',
    label: 'CENTRAL BANKS',
    re: /fed |federal reserve|ecb|boj|bank of england|rate cut|rate hike|powell|fomc/i,
  },
  {
    id: 'geo',
    label: 'GEOPOLITICS',
    re: /tariff|sanction|war |election|geopolit|opec|trade war|china|russia/i,
  },
];

function SentimentChip({ score }: { score: number | undefined }) {
  if (score === undefined) return null;
  const label = score > 0.15 ? 'BULLISH' : score < -0.15 ? 'BEARISH' : 'NEUTRAL';
  const cls = score > 0.15 ? 'senti-pos' : score < -0.15 ? 'senti-neg' : 'senti-neu';
  return (
    <span className={`badge ${cls}`} title={`sentiment ${score.toFixed(2)} (-1..1, from source)`}>
      {label}
    </span>
  );
}

export function News({ tab }: { tab: Tab }) {
  const qs = tab.symbol ? `?symbol=${encodeURIComponent(tab.symbol)}` : '';
  const { state, refresh } = useEnvelope<NewsItem[]>(`/api/news${qs}`, 300_000);
  const [topic, setTopic] = useState<string | null>(null);

  const items = useMemo(() => {
    if (state.status !== 'ready') return [];
    const all = state.env.data;
    if (!topic) return all;
    const t = TOPICS.find((x) => x.id === topic);
    if (!t) return all;
    return all.filter((n) => t.re.test(`${n.headline} ${n.snippet ?? ''}`));
  }, [state, topic]);

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {state.status === 'ready' && <DataBadge env={state.env} />}
          <button type="button" className="btn" onClick={refresh}>
            REFRESH
          </button>
        </>
      }
    >
      <div className="glos-cats">
        <button
          type="button"
          className={`range-btn${topic === null ? ' range-btn-active' : ''}`}
          onClick={() => setTopic(null)}
        >
          ALL
        </button>
        {TOPICS.map((t) => (
          <button
            type="button"
            key={t.id}
            className={`range-btn${topic === t.id ? ' range-btn-active' : ''}`}
            onClick={() => setTopic(topic === t.id ? null : t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {state.status === 'loading' && <StateView kind="loading" title="Fetching headlines…" />}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title="News unavailable"
          detail={state.message}
          hint="Check your connection, force the demo provider in SET, or add a free marketaux key for sentiment-tagged news."
        />
      )}
      {state.status === 'ready' && items.length === 0 && (
        <StateView
          kind="empty"
          title={topic ? 'No headlines match this topic filter' : 'No headlines'}
          detail={
            topic
              ? 'Topic filters are keyword-based over the currently loaded articles.'
              : undefined
          }
        />
      )}
      {state.status === 'ready' && items.length > 0 && (
        <ul className="news-list">
          {items.map((n) => (
            <li key={n.id} className="news-item news-item-rich">
              <div className="news-row">
                <span className="news-time dim">{fmtDateTime(n.publishedAt)}</span>
                <span className="news-source accent">{n.source}</span>
                <SentimentChip score={n.sentiment} />
                {n.url ? (
                  <a className="news-headline" href={n.url} target="_blank" rel="noreferrer">
                    {n.headline}
                  </a>
                ) : (
                  <span className="news-headline">{n.headline}</span>
                )}
              </div>
              {(n.snippet || (n.entities && n.entities.length > 0)) && (
                <div className="news-sub">
                  {n.snippet && <span className="dim small news-snippet">{n.snippet}</span>}
                  {n.entities?.map((e) => (
                    <span
                      key={e.symbol}
                      className={`badge ${
                        e.sentiment === undefined
                          ? ''
                          : e.sentiment > 0.15
                            ? 'senti-pos'
                            : e.sentiment < -0.15
                              ? 'senti-neg'
                              : 'senti-neu'
                      }`}
                      title={
                        e.sentiment !== undefined
                          ? `entity sentiment ${e.sentiment.toFixed(2)}`
                          : e.name
                      }
                    >
                      {e.symbol}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </ModuleFrame>
  );
}
