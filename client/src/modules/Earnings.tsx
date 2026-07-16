import type { EarningsEvent, EarningsRow } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { parse } from '../commands/parser';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtNum, fmtPct } from '../lib/format';
import { type Tab, useWorkspace } from '../state/workspace';

/** With a symbol: surprise history. Without: upcoming market calendar. */
export function Earnings({ tab }: { tab: Tab }) {
  const ws = useWorkspace();
  const symbol = tab.symbol ?? null;
  const { state, refresh } = useEnvelope<EarningsRow[] | EarningsEvent[]>(
    symbol ? `/api/earnings?symbol=${encodeURIComponent(symbol)}` : '/api/earnings-calendar',
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
      {state.status === 'loading' && (
        <StateView
          kind="loading"
          title={symbol ? `Loading ${symbol} earnings history…` : 'Loading earnings calendar…'}
        />
      )}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title="Earnings data unavailable"
          detail={state.message}
          hint="Add a free Finnhub key in SET for live earnings data."
        />
      )}
      {state.status === 'ready' && symbol && (
        <table className="grid-table research-table">
          <thead>
            <tr>
              <th>Quarter</th>
              <th className="num">EPS est.</th>
              <th className="num">EPS actual</th>
              <th className="num">Surprise</th>
            </tr>
          </thead>
          <tbody>
            {(state.env.data as EarningsRow[]).map((r) => (
              <tr key={r.period}>
                <td className="dim">{r.period}</td>
                <td className="num">{fmtNum(r.epsEstimate ?? undefined)}</td>
                <td className="num">{fmtNum(r.epsActual ?? undefined)}</td>
                <td
                  className={`num ${r.surprisePct != null && r.surprisePct >= 0 ? 'pos' : 'neg'}`}
                >
                  {r.surprisePct != null ? fmtPct(r.surprisePct) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {state.status === 'ready' && !symbol && (
        <>
          <table className="grid-table research-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Symbol</th>
                <th>Timing</th>
                <th className="num">EPS est.</th>
              </tr>
            </thead>
            <tbody>
              {(state.env.data as EarningsEvent[]).map((e) => (
                <tr key={`${e.symbol}|${e.date}|${e.hour ?? ''}`}>
                  <td className="dim">{e.date}</td>
                  <td>
                    <button
                      type="button"
                      className="link-btn accent"
                      onClick={() => {
                        const inv = parse(`${e.symbol} ERN`);
                        if (inv) ws.execute(inv);
                      }}
                    >
                      {e.symbol}
                    </button>
                  </td>
                  <td className="dim">
                    {e.hour === 'bmo' ? 'before open' : e.hour === 'amc' ? 'after close' : '—'}
                  </td>
                  <td className="num">{fmtNum(e.epsEstimate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dim small">
            Next two weeks. Click a symbol for its surprise history ("AAPL ERN").
          </p>
        </>
      )}
    </ModuleFrame>
  );
}
