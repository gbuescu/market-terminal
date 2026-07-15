import { useCallback, useEffect, useState } from 'react';
import type { Envelope, Fundamentals } from '../../../shared/types';
import { getEnvelope } from '../api/client';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtLarge, fmtNum, fmtPct, fmtPrice } from '../lib/format';
import type { Tab } from '../state/workspace';

type CompareState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; envs: Envelope<Fundamentals>[] };

const ROWS: { label: string; value: (f: Fundamentals) => string }[] = [
  { label: 'Name', value: (f) => f.name ?? '—' },
  { label: 'Sector', value: (f) => f.sector ?? f.industry ?? '—' },
  { label: 'Mkt Cap', value: (f) => fmtLarge(f.marketCap) },
  { label: 'P/E (TTM)', value: (f) => fmtNum(f.peTTM, 1) },
  { label: 'EPS (TTM)', value: (f) => fmtNum(f.epsTTM) },
  {
    label: 'Div Yield',
    value: (f) => (f.dividendYield !== undefined ? `${fmtNum(f.dividendYield)}%` : '—'),
  },
  {
    label: 'Gross Mgn',
    value: (f) => (f.grossMarginTTM !== undefined ? `${fmtNum(f.grossMarginTTM, 1)}%` : '—'),
  },
  {
    label: 'Op Mgn',
    value: (f) =>
      f.operatingMarginTTM !== undefined ? `${fmtNum(f.operatingMarginTTM, 1)}%` : '—',
  },
  {
    label: 'Net Mgn',
    value: (f) => (f.netMarginTTM !== undefined ? `${fmtNum(f.netMarginTTM, 1)}%` : '—'),
  },
  { label: 'ROE', value: (f) => (f.roeTTM !== undefined ? `${fmtNum(f.roeTTM, 1)}%` : '—') },
  { label: 'D/E', value: (f) => fmtNum(f.debtToEquity) },
  { label: 'Beta', value: (f) => fmtNum(f.beta) },
  { label: '52W High', value: (f) => fmtPrice(f.week52High) },
  { label: '52W Low', value: (f) => fmtPrice(f.week52Low) },
  {
    label: '52W Chg',
    value: (f) => (f.week52ChangePct !== undefined ? fmtPct(f.week52ChangePct) : '—'),
  },
];

const SYMBOL_RE = /^[A-Z0-9.\-:^=/]{1,15}$/;

export function Peers({ tab }: { tab: Tab }) {
  const [input, setInput] = useState(tab.symbol ? `${tab.symbol}, ` : '');
  const [state, setState] = useState<CompareState>({ status: 'idle' });

  const compare = useCallback((raw: string) => {
    const symbols = [
      ...new Set(
        raw
          .toUpperCase()
          .split(/[,\s]+/)
          .map((s) => s.trim())
          .filter((s) => SYMBOL_RE.test(s)),
      ),
    ].slice(0, 6);
    if (symbols.length < 2) {
      setState({ status: 'error', message: 'enter at least two valid symbols' });
      return;
    }
    setState({ status: 'loading' });
    Promise.all(
      symbols.map((s) =>
        getEnvelope<Fundamentals>(`/api/fundamentals?symbol=${encodeURIComponent(s)}`),
      ),
    )
      .then((envs) => setState({ status: 'ready', envs }))
      .catch((err: unknown) =>
        setState({ status: 'error', message: err instanceof Error ? err.message : 'failed' }),
      );
  }, []);

  // "AAPL RV" convenience: pre-run against a couple of obvious mega-cap peers.
  useEffect(() => {
    if (tab.symbol) {
      const seed = `${tab.symbol}, MSFT, GOOGL`;
      setInput(seed);
      compare(seed);
    }
  }, [tab.symbol, compare]);

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        state.status === 'ready' && state.envs[0] ? <DataBadge env={state.envs[0]} /> : undefined
      }
    >
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          compare(input);
        }}
      >
        <input
          className="text-input text-input-full"
          placeholder="symbols to compare, e.g. AAPL, MSFT, GOOGL (max 6)"
          value={input}
          aria-label="Symbols to compare"
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn">
          COMPARE
        </button>
      </form>

      {state.status === 'idle' && (
        <StateView
          kind="empty"
          title="No comparison yet"
          detail="Enter two to six symbols above and press COMPARE."
          hint='Tip: "AAPL RV" seeds a comparison automatically.'
        />
      )}
      {state.status === 'loading' && <StateView kind="loading" title="Comparing fundamentals…" />}
      {state.status === 'error' && (
        <StateView kind="error" title="Comparison failed" detail={state.message} />
      )}
      {state.status === 'ready' && (
        <table className="grid-table rv-table">
          <thead>
            <tr>
              <th>Metric</th>
              {state.envs.map((e) => (
                <th key={e.data.symbol} className="num accent">
                  {e.data.symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td className="dim">{row.label}</td>
                {state.envs.map((e) => (
                  <td key={e.data.symbol} className="num">
                    {row.value(e.data)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModuleFrame>
  );
}
