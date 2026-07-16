import type { IpoEvent } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtVolume } from '../lib/format';
import type { Tab } from '../state/workspace';

export function Ipo({ tab }: { tab: Tab }) {
  const { state, refresh } = useEnvelope<IpoEvent[]>('/api/ipo-calendar');

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
      {state.status === 'loading' && <StateView kind="loading" title="Loading IPO calendar…" />}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title="IPO calendar unavailable"
          detail={state.message}
          hint="Add a free Finnhub key in SET for the live IPO calendar."
        />
      )}
      {state.status === 'ready' && state.env.data.length === 0 && (
        <StateView kind="empty" title="No IPOs in the window" />
      )}
      {state.status === 'ready' && state.env.data.length > 0 && (
        <table className="grid-table research-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Company</th>
              <th>Symbol</th>
              <th>Exchange</th>
              <th className="num">Price range</th>
              <th className="num">Shares</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {state.env.data.map((e) => (
              <tr key={`${e.name}|${e.date}`}>
                <td className="dim">{e.date}</td>
                <td>{e.name}</td>
                <td className="accent">{e.symbol ?? '—'}</td>
                <td className="dim">{e.exchange ?? '—'}</td>
                <td className="num">{e.priceRange ?? '—'}</td>
                <td className="num">{fmtVolume(e.shares)}</td>
                <td className="dim">{e.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModuleFrame>
  );
}
