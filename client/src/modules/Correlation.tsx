import { useCallback, useEffect, useState } from 'react';
import type { Envelope, Series } from '../../../shared/types';
import { getEnvelope } from '../api/client';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

/** Default cross-asset basket — all resolvable via the keyless quotes path. */
const BASKET: { symbol: string; name: string }[] = [
  { symbol: 'SPY', name: 'US EQ' },
  { symbol: 'EFA', name: 'INTL EQ' },
  { symbol: 'TLT', name: 'LONG UST' },
  { symbol: 'HYG', name: 'HY CREDIT' },
  { symbol: 'GLD', name: 'GOLD' },
  { symbol: 'USO', name: 'OIL' },
  { symbol: 'UUP', name: 'USD' },
  { symbol: 'BTC-USD', name: 'BITCOIN' },
];

type CorrState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; env: Envelope<Series>; symbols: string[]; matrix: number[][] };

/** Pearson correlation of daily returns over overlapping dates. */
function correlate(a: Map<string, number>, b: Map<string, number>): number {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [date, ra] of a) {
    const rb = b.get(date);
    if (rb !== undefined) {
      xs.push(ra);
      ys.push(rb);
    }
  }
  const n = xs.length;
  if (n < 20) return Number.NaN; // not enough overlap to be meaningful
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    cov += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  return vx > 0 && vy > 0 ? cov / Math.sqrt(vx * vy) : Number.NaN;
}

function dailyReturns(s: Series): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 1; i < s.candles.length; i++) {
    const prev = s.candles[i - 1].c;
    if (prev > 0) out.set(s.candles[i].t.slice(0, 10), s.candles[i].c / prev - 1);
  }
  return out;
}

function cellColor(r: number): string {
  if (Number.isNaN(r)) return 'transparent';
  const a = Math.min(Math.abs(r), 1) * 0.5;
  return r >= 0 ? `rgba(46, 204, 113, ${a})` : `rgba(231, 76, 60, ${a})`;
}

export function Correlation({ tab }: { tab: Tab }) {
  const [state, setState] = useState<CorrState>({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    Promise.all(
      BASKET.map((b) =>
        getEnvelope<Series>(`/api/series?symbol=${encodeURIComponent(b.symbol)}&range=6M`).catch(
          () => null,
        ),
      ),
    ).then((envs) => {
      const ok = envs.filter((e): e is Envelope<Series> => e !== null);
      if (ok.length < 3) {
        setState({
          status: 'error',
          message: 'not enough series available to build a correlation matrix',
        });
        return;
      }
      const returns = ok.map((e) => dailyReturns(e.data));
      const matrix = returns.map((a) => returns.map((b) => correlate(a, b)));
      setState({
        status: 'ready',
        env: ok[0],
        symbols: ok.map((e) => e.data.symbol),
        matrix,
      });
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const nameFor = (symbol: string) => BASKET.find((b) => b.symbol === symbol)?.name ?? symbol;

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {state.status === 'ready' && <DataBadge env={state.env} />}
          <button type="button" className="btn" onClick={load}>
            REFRESH
          </button>
        </>
      }
    >
      {state.status === 'loading' && (
        <StateView kind="loading" title="Computing cross-asset correlations…" />
      )}
      {state.status === 'error' && (
        <StateView kind="error" title="Correlation panel unavailable" detail={state.message} />
      )}
      {state.status === 'ready' && (
        <>
          <table className="grid-table corr-table">
            <thead>
              <tr>
                <th />
                {state.symbols.map((s) => (
                  <th key={s} className="num corr-head" title={s}>
                    {nameFor(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.symbols.map((rowSym, i) => (
                <tr key={rowSym}>
                  <td className="dim" title={rowSym}>
                    {nameFor(rowSym)}
                  </td>
                  {state.symbols.map((colSym, j) => {
                    const r = state.matrix[i][j];
                    return (
                      <td
                        key={colSym}
                        className="num corr-cell"
                        style={{ background: i === j ? 'transparent' : cellColor(r) }}
                      >
                        {i === j ? '—' : Number.isNaN(r) ? 'n/a' : r.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dim small">
            Pearson correlation of daily returns, trailing 6 months, computed locally from the
            active series provider. +1 = move together, −1 = move opposite. ETF proxies (EFA, TLT,
            HYG, GLD, USO, UUP) stand in for their asset classes.
          </p>
        </>
      )}
    </ModuleFrame>
  );
}
