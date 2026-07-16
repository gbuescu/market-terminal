import type { HoldingRow } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtLarge, fmtNum, fmtVolume } from '../lib/format';
import type { Tab } from '../state/workspace';

export function Holdings({ tab }: { tab: Tab }) {
  const symbol = tab.symbol ?? null;
  const { state, refresh } = useEnvelope<HoldingRow[]>(
    symbol ? `/api/holdings?symbol=${encodeURIComponent(symbol)}` : null,
  );

  if (!symbol) {
    return (
      <ModuleFrame tab={tab}>
        <StateView
          kind="empty"
          title="No security selected"
          detail='Run the holdings command with a symbol, e.g. "AAPL HOLD".'
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
      {state.status === 'loading' && <StateView kind="loading" title="Loading holders…" />}
      {state.status === 'error' && (
        <StateView
          kind="info"
          title="Institutional holdings: no free data source"
          detail="13F aggregation (who holds this stock) has no free API — parsing every manager's quarterly 13F filing requires a paid data pipeline. This module stays honest rather than faking it."
          hint='To explore the SHAPE of the data with synthetic numbers, force "demo" for holdings in SET.'
        />
      )}
      {state.status === 'ready' && (
        <table className="grid-table research-table">
          <thead>
            <tr>
              <th>Holder</th>
              <th className="num">Shares</th>
              <th className="num">Value</th>
              <th className="num">% out</th>
              <th>Reported</th>
            </tr>
          </thead>
          <tbody>
            {state.env.data.map((h) => (
              <tr key={h.holder}>
                <td>{h.holder}</td>
                <td className="num">{fmtVolume(h.shares)}</td>
                <td className="num">{fmtLarge(h.value)}</td>
                <td className="num">{fmtNum(h.pctOut)}</td>
                <td className="dim">{h.reportDate ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModuleFrame>
  );
}
