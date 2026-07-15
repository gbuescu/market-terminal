import { useMemo, useState } from 'react';
import type { Fundamentals } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { parse } from '../commands/parser';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtLarge, fmtNum, fmtPct } from '../lib/format';
import { type Tab, useWorkspace } from '../state/workspace';

type SortKey = 'symbol' | 'marketCap' | 'peTTM' | 'dividendYield' | 'week52ChangePct';

export function Screener({ tab }: { tab: Tab }) {
  const ws = useWorkspace();
  const { state, refresh } = useEnvelope<Fundamentals[]>('/api/screener');
  const [minCapB, setMinCapB] = useState('');
  const [maxPe, setMaxPe] = useState('');
  const [minYield, setMinYield] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDesc, setSortDesc] = useState(true);

  const rows = useMemo(() => {
    if (state.status !== 'ready') return [];
    const minCap = Number(minCapB) > 0 ? Number(minCapB) * 1e9 : null;
    const pe = Number(maxPe) > 0 ? Number(maxPe) : null;
    const dy = Number(minYield) > 0 ? Number(minYield) : null;
    const filtered = state.env.data.filter((f) => {
      if (minCap !== null && (f.marketCap ?? 0) < minCap) return false;
      if (pe !== null && (f.peTTM === undefined || f.peTTM > pe || f.peTTM <= 0)) return false;
      if (dy !== null && (f.dividendYield ?? 0) < dy) return false;
      return true;
    });
    const dir = sortDesc ? -1 : 1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'symbol') return dir * a.symbol.localeCompare(b.symbol);
      return (
        dir * ((a[sortKey] ?? Number.NEGATIVE_INFINITY) - (b[sortKey] ?? Number.NEGATIVE_INFINITY))
      );
    });
  }, [state, minCapB, maxPe, minYield, sortKey, sortDesc]);

  const sortBy = (key: SortKey) => {
    if (key === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(key !== 'symbol');
    }
  };

  const header = (key: SortKey, label: string, numeric = true) => (
    <th className={numeric ? 'num' : ''}>
      <button type="button" className="link-btn th-sort" onClick={() => sortBy(key)}>
        {label}
        {sortKey === key ? (sortDesc ? ' ▼' : ' ▲') : ''}
      </button>
    </th>
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
      <div className="inline-form">
        <label className="dim small" htmlFor="scr-cap">
          min mkt cap ($B)
        </label>
        <input
          id="scr-cap"
          className="text-input text-input-narrow"
          value={minCapB}
          inputMode="decimal"
          onChange={(e) => setMinCapB(e.target.value)}
        />
        <label className="dim small" htmlFor="scr-pe">
          max P/E
        </label>
        <input
          id="scr-pe"
          className="text-input text-input-narrow"
          value={maxPe}
          inputMode="decimal"
          onChange={(e) => setMaxPe(e.target.value)}
        />
        <label className="dim small" htmlFor="scr-dy">
          min div yield (%)
        </label>
        <input
          id="scr-dy"
          className="text-input text-input-narrow"
          value={minYield}
          inputMode="decimal"
          onChange={(e) => setMinYield(e.target.value)}
        />
      </div>

      {state.status === 'loading' && (
        <StateView
          kind="loading"
          title="Screening universe…"
          detail="First load with a live keyed provider can take a minute; results are cached for a day."
        />
      )}
      {state.status === 'error' && (
        <StateView kind="error" title="Screener unavailable" detail={state.message} />
      )}
      {state.status === 'ready' && (
        <>
          <table className="grid-table scr-table">
            <thead>
              <tr>
                {header('symbol', 'Symbol', false)}
                <th>Name</th>
                <th>Sector</th>
                {header('marketCap', 'Mkt Cap')}
                {header('peTTM', 'P/E')}
                {header('dividendYield', 'Div %')}
                {header('week52ChangePct', '52W %')}
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.symbol}>
                  <td>
                    <button
                      type="button"
                      className="link-btn accent"
                      title={`Open ${f.symbol} fundamentals`}
                      onClick={() => {
                        const inv = parse(`${f.symbol} FA`);
                        if (inv) ws.execute(inv);
                      }}
                    >
                      {f.symbol}
                    </button>
                  </td>
                  <td className="dim">{f.name ?? '—'}</td>
                  <td className="dim">{f.sector ?? f.industry ?? '—'}</td>
                  <td className="num">{fmtLarge(f.marketCap)}</td>
                  <td className="num">{fmtNum(f.peTTM, 1)}</td>
                  <td className="num">
                    {f.dividendYield !== undefined ? fmtNum(f.dividendYield) : '—'}
                  </td>
                  <td
                    className={`num ${f.week52ChangePct !== undefined && f.week52ChangePct < 0 ? 'neg' : 'pos'}`}
                  >
                    {f.week52ChangePct !== undefined ? fmtPct(f.week52ChangePct) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dim small">
            {rows.length} of {state.env.data.length} in the large-cap universe match. Click a column
            to sort, a symbol for fundamentals.
          </p>
        </>
      )}
    </ModuleFrame>
  );
}
