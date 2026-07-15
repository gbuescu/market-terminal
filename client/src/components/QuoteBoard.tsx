import type { Quote } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { parse } from '../commands/parser';
import { fmtChange, fmtPct, fmtPrice, signClass } from '../lib/format';
import { type Tab, useWorkspace } from '../state/workspace';
import { DataBadge } from './DataBadge';
import { ModuleFrame, StateView } from './ModuleFrame';

export interface BoardRow {
  symbol: string;
  name: string;
}

export interface BoardSection {
  label: string;
  rows: BoardRow[];
}

/**
 * Shared dashboard: sections of symbols priced through /api/quotes.
 * Used by the FX, rates and commodities modules.
 */
export function QuoteBoard({ tab, sections }: { tab: Tab; sections: BoardSection[] }) {
  const ws = useWorkspace();
  const symbols = sections.flatMap((s) => s.rows.map((r) => r.symbol));
  const { state, refresh } = useEnvelope<Quote[]>(
    `/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}`,
    60_000,
  );

  const openChart = (symbol: string) => {
    const inv = parse(`${symbol} GP`);
    if (inv) ws.execute(inv);
  };

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
          {sections.map((section) => {
            const bySymbol = new Map(state.env.data.map((q) => [q.symbol, q]));
            return (
              <div key={section.label} className="panel monitor-panel">
                <div className="panel-title">{section.label}</div>
                <table className="grid-table quote-rows">
                  <tbody>
                    {section.rows.map((row) => {
                      const q = bySymbol.get(row.symbol);
                      return (
                        <tr key={row.symbol}>
                          <td className="mono-name">
                            <button
                              type="button"
                              className="link-btn"
                              title={`Open ${row.symbol} chart`}
                              onClick={() => openChart(row.symbol)}
                            >
                              {row.name}
                            </button>
                          </td>
                          <td className="num">{fmtPrice(q?.price)}</td>
                          <td className={`num ${signClass(q?.change)}`}>{fmtChange(q?.change)}</td>
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
