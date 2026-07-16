import type { Quote } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { parse } from '../commands/parser';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtPct } from '../lib/format';
import { type Tab, useWorkspace } from '../state/workspace';

/** SPDR sector ETFs as sector proxies — live via the keyless quotes path. */
const SECTORS: { symbol: string; name: string }[] = [
  { symbol: 'XLK', name: 'TECHNOLOGY' },
  { symbol: 'XLF', name: 'FINANCIALS' },
  { symbol: 'XLV', name: 'HEALTH CARE' },
  { symbol: 'XLY', name: 'CONS. DISCRET.' },
  { symbol: 'XLP', name: 'CONS. STAPLES' },
  { symbol: 'XLE', name: 'ENERGY' },
  { symbol: 'XLI', name: 'INDUSTRIALS' },
  { symbol: 'XLB', name: 'MATERIALS' },
  { symbol: 'XLU', name: 'UTILITIES' },
  { symbol: 'XLRE', name: 'REAL ESTATE' },
  { symbol: 'XLC', name: 'COMMS' },
  { symbol: 'SPY', name: 'S&P 500' },
];

/** chg% -> panel background: green/red intensity scaled to ±3%. */
function tileColor(pct: number | undefined): string {
  if (pct === undefined) return 'transparent';
  const a = Math.min(Math.abs(pct) / 3, 1) * 0.55;
  return pct >= 0 ? `rgba(46, 204, 113, ${a})` : `rgba(231, 76, 60, ${a})`;
}

export function Heatmap({ tab }: { tab: Tab }) {
  const ws = useWorkspace();
  const { state, refresh } = useEnvelope<Quote[]>(
    `/api/quotes?symbols=${encodeURIComponent(SECTORS.map((s) => s.symbol).join(','))}`,
    60_000,
  );
  const bySymbol =
    state.status === 'ready'
      ? new Map(state.env.data.map((q) => [q.symbol, q]))
      : new Map<string, Quote>();

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
      {state.status === 'loading' && <StateView kind="loading" title="Loading sector quotes…" />}
      {state.status === 'error' && (
        <StateView kind="error" title="Sector data unavailable" detail={state.message} />
      )}
      {state.status === 'ready' && (
        <>
          <div className="heatmap-grid">
            {SECTORS.map((s) => {
              const q = bySymbol.get(s.symbol);
              return (
                <button
                  type="button"
                  key={s.symbol}
                  className="heat-tile"
                  style={{ background: tileColor(q?.changePct) }}
                  title={`Open ${s.symbol} chart`}
                  onClick={() => {
                    const inv = parse(`${s.symbol} GP`);
                    if (inv) ws.execute(inv);
                  }}
                >
                  <span className="heat-name">{s.name}</span>
                  <span className="heat-sym dim">{s.symbol}</span>
                  <span className={`heat-pct num ${q && q.changePct >= 0 ? 'pos' : 'neg'}`}>
                    {fmtPct(q?.changePct)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="dim small">
            Sector performance via SPDR sector ETFs, today vs previous close. Color intensity scales
            to ±3%. Click a tile for its chart.
          </p>
        </>
      )}
    </ModuleFrame>
  );
}
