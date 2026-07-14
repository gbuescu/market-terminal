import type { Quote } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { ALL_MONITOR_SYMBOLS, MONITOR_REGIONS } from '../config/monitor';
import { fmtPct, fmtPrice, signClass } from '../lib/format';
import type { Tab } from '../state/workspace';

export function Monitor({ tab }: { tab: Tab }) {
  const { state, refresh } = useEnvelope<Quote[]>(
    `/api/quotes?symbols=${encodeURIComponent(ALL_MONITOR_SYMBOLS.join(','))}`,
    60_000,
  );

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
      {state.status === 'loading' && <StateView kind="loading" title="Querying quotes…" />}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title="Quotes unavailable"
          detail={state.message}
          hint="Check your connection, or force the demo provider in SET."
        />
      )}
      {state.status === 'ready' && (
        <div className="monitor-grid">
          {MONITOR_REGIONS.map((region) => {
            const bySymbol = new Map(state.env.data.map((q) => [q.symbol, q]));
            return (
              <div key={region.label} className="panel monitor-panel">
                <div className="panel-title">{region.label}</div>
                <table className="grid-table quote-rows">
                  <tbody>
                    {region.rows.map((row) => {
                      const q = bySymbol.get(row.symbol);
                      return (
                        <tr key={row.symbol}>
                          <td className="mono-name">{row.name}</td>
                          <td className="num">{fmtPrice(q?.price)}</td>
                          <td className={`num ${signClass(q?.changePct)}`}>
                            {fmtPct(q?.changePct)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </ModuleFrame>
  );
}
