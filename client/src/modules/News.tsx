import type { NewsItem } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtDateTime } from '../lib/format';
import type { Tab } from '../state/workspace';

export function News({ tab }: { tab: Tab }) {
  const qs = tab.symbol ? `?symbol=${encodeURIComponent(tab.symbol)}` : '';
  const { state, refresh } = useEnvelope<NewsItem[]>(`/api/news${qs}`, 300_000);

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
      {state.status === 'loading' && <StateView kind="loading" title="Fetching headlines…" />}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title="News unavailable"
          detail={state.message}
          hint="Check your connection, or force the demo provider in SET."
        />
      )}
      {state.status === 'ready' && state.env.data.length === 0 && (
        <StateView
          kind="empty"
          title={tab.symbol ? `No headlines for ${tab.symbol}` : 'No headlines'}
        />
      )}
      {state.status === 'ready' && state.env.data.length > 0 && (
        <ul className="news-list">
          {state.env.data.map((n) => (
            <li key={n.id} className="news-item">
              <span className="news-time dim">{fmtDateTime(n.publishedAt)}</span>
              <span className="news-source accent">{n.source}</span>
              {n.url ? (
                <a className="news-headline" href={n.url} target="_blank" rel="noreferrer">
                  {n.headline}
                </a>
              ) : (
                <span className="news-headline">{n.headline}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </ModuleFrame>
  );
}
