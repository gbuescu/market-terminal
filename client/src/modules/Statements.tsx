import { useState } from 'react';
import type {
  StatementPeriodicity,
  Statements as StatementsDto,
  StatementType,
} from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ExportButton } from '../components/ExportButton';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtLarge } from '../lib/format';
import type { Tab } from '../state/workspace';

const TYPES: { id: StatementType; label: string }[] = [
  { id: 'income', label: 'INCOME' },
  { id: 'balance', label: 'BALANCE' },
  { id: 'cashflow', label: 'CASH FLOW' },
];

export function Statements({ tab }: { tab: Tab }) {
  const symbol = tab.symbol ?? null;
  const [type, setType] = useState<StatementType>('income');
  const [period, setPeriod] = useState<StatementPeriodicity>('annual');
  const { state, refresh } = useEnvelope<StatementsDto>(
    symbol
      ? `/api/statements?symbol=${encodeURIComponent(symbol)}&type=${type}&period=${period}`
      : null,
  );

  if (!symbol) {
    return (
      <ModuleFrame tab={tab}>
        <StateView
          kind="empty"
          title="No security selected"
          detail="Run the statements command with a symbol."
          hint='Example: type "AAPL FS" in the command bar.'
        />
      </ModuleFrame>
    );
  }

  const s = state.status === 'ready' ? state.env.data : null;

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {state.status === 'ready' && <DataBadge env={state.env} />}
          <ExportButton
            name={`statements-${symbol ?? 'x'}-${type}`}
            headers={['LineItem', ...(s?.periods.map((p) => p.period) ?? [])]}
            disabled={!s}
            rows={() =>
              (s?.lineItems ?? []).map((item) => [
                item,
                ...(s?.periods ?? []).map((p) => p.values[item] ?? ''),
              ])
            }
          />
          <span className="chart-ranges">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t.id}
                className={`range-btn${t.id === type ? ' range-btn-active' : ''}`}
                onClick={() => setType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </span>
          <span className="chart-toggles">
            <button
              type="button"
              className={`range-btn${period === 'annual' ? ' range-btn-active' : ''}`}
              onClick={() => setPeriod('annual')}
            >
              ANNUAL
            </button>
            <button
              type="button"
              className={`range-btn${period === 'quarterly' ? ' range-btn-active' : ''}`}
              onClick={() => setPeriod('quarterly')}
            >
              QTR
            </button>
          </span>
          <button type="button" className="btn" onClick={refresh}>
            REFRESH
          </button>
        </>
      }
    >
      {state.status === 'loading' && (
        <StateView kind="loading" title={`Loading ${symbol} ${type} statement…`} />
      )}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title={`Statements unavailable for ${symbol}`}
          detail={state.message}
          hint="US filers come free from SEC EDGAR. Non-US symbols need an Alpha Vantage key in SET, or force the demo provider."
        />
      )}
      {s && (
        <>
          <table className="grid-table fs-table">
            <thead>
              <tr>
                <th>
                  {s.periodicity === 'quarterly' ? 'Quarterly' : 'Annual'}
                  {s.currency ? ` (${s.currency})` : ''}
                </th>
                {s.periods.map((p) => (
                  <th key={p.period} className="num">
                    {p.period.slice(0, 7)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.lineItems.map((item) => (
                <tr key={item}>
                  <td>{item}</td>
                  {s.periods.map((p) => {
                    const v = p.values[item];
                    return (
                      <td key={p.period} className={`num${v !== null && v < 0 ? ' neg' : ''}`}>
                        {fmtLarge(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dim small">
            Most recent fiscal years, left to right. Line items are normalized across providers —
            see docs/DATA_PROVIDERS.md for source coverage.
          </p>
        </>
      )}
    </ModuleFrame>
  );
}
