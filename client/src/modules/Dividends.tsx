import type { DividendRow } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

export function Dividends({ tab }: { tab: Tab }) {
  const symbol = tab.symbol ?? null;
  const { state, refresh } = useEnvelope<DividendRow[]>(
    symbol ? `/api/dividends?symbol=${encodeURIComponent(symbol)}` : null,
  );

  if (!symbol) {
    return (
      <ModuleFrame tab={tab}>
        <StateView
          kind="empty"
          title="No security selected"
          detail='Run the dividends command with a symbol, e.g. "AAPL DIV".'
        />
      </ModuleFrame>
    );
  }

  const rows = state.status === 'ready' ? state.env.data : [];
  const ttm = rows.slice(0, 4).reduce((s, r) => s + r.amount, 0);

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
      {state.status === 'loading' && (
        <StateView kind="loading" title={`Loading ${symbol} dividend history…`} />
      )}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title={`Dividend history unavailable for ${symbol}`}
          detail={state.message}
          hint="Sourced from SEC filings (US filers). Non-payers and non-US symbols have no history. Split history has no free source and is not shown."
        />
      )}
      {state.status === 'ready' && (
        <>
          <p className="small">
            trailing 12m declared: <span className="accent num">{ttm.toFixed(2)}</span>{' '}
            <span className="dim">per share ({rows[0]?.currency ?? 'USD'})</span>
          </p>
          <table className="grid-table research-table">
            <thead>
              <tr>
                <th>Period end</th>
                <th className="num">Per share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date}>
                  <td className="dim">{r.date}</td>
                  <td className="num">{r.amount.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dim small">
            Per-share dividends as declared in SEC filings (quarterly). Split history is not
            available from any free source — see docs/DATA_PROVIDERS.md.
          </p>
        </>
      )}
    </ModuleFrame>
  );
}
