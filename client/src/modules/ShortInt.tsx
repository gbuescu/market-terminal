import type { ShortInterestRow } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtNum, fmtVolume } from '../lib/format';
import type { Tab } from '../state/workspace';

export function ShortInt({ tab }: { tab: Tab }) {
  const symbol = tab.symbol ?? null;
  const { state, refresh } = useEnvelope<ShortInterestRow[]>(
    symbol ? `/api/short?symbol=${encodeURIComponent(symbol)}` : null,
  );

  if (!symbol) {
    return (
      <ModuleFrame tab={tab}>
        <StateView
          kind="empty"
          title="No security selected"
          detail='Run the short-interest command with a symbol, e.g. "AAPL SI".'
        />
      </ModuleFrame>
    );
  }

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
      {state.status === 'loading' && <StateView kind="loading" title="Loading short interest…" />}
      {state.status === 'error' && (
        <StateView
          kind="info"
          title="Short interest: unavailable in free tier"
          detail="FINRA publishes short interest but its API requires a registered OAuth account, and market-data vendors gate it behind paid plans. No free keyless source exists."
          hint='To explore the SHAPE of the data with synthetic numbers, force "demo" for short in SET.'
        />
      )}
      {state.status === 'ready' && (
        <table className="grid-table research-table">
          <thead>
            <tr>
              <th>Settlement date</th>
              <th className="num">Short interest</th>
              <th className="num">% float</th>
              <th className="num">Days to cover</th>
            </tr>
          </thead>
          <tbody>
            {state.env.data.map((r) => (
              <tr key={r.date}>
                <td className="dim">{r.date}</td>
                <td className="num">{fmtVolume(r.shortInterest)}</td>
                <td className="num">{fmtNum(r.pctFloat)}</td>
                <td className="num">{fmtNum(r.daysToCover, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModuleFrame>
  );
}
