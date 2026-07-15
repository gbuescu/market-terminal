import type { Fundamentals as FundamentalsDto } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { parse } from '../commands/parser';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtLarge, fmtNum, fmtPct, fmtPrice } from '../lib/format';
import { type Tab, useWorkspace } from '../state/workspace';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value num">{value}</div>
    </div>
  );
}

export function Fundamentals({ tab }: { tab: Tab }) {
  const ws = useWorkspace();
  const symbol = tab.symbol ?? null;
  const { state, refresh } = useEnvelope<FundamentalsDto>(
    symbol ? `/api/fundamentals?symbol=${encodeURIComponent(symbol)}` : null,
  );

  if (!symbol) {
    return (
      <ModuleFrame tab={tab}>
        <StateView
          kind="empty"
          title="No security selected"
          detail="Run the fundamentals command with a symbol."
          hint='Example: type "AAPL FA" in the command bar.'
        />
      </ModuleFrame>
    );
  }

  const f = state.status === 'ready' ? state.env.data : null;

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {state.status === 'ready' && <DataBadge env={state.env} />}
          <button
            type="button"
            className="btn"
            title="Open statements"
            onClick={() => {
              const inv = parse(`${symbol} FS`);
              if (inv) ws.execute(inv);
            }}
          >
            FS
          </button>
          <button type="button" className="btn" onClick={refresh}>
            REFRESH
          </button>
        </>
      }
    >
      {state.status === 'loading' && (
        <StateView kind="loading" title={`Loading ${symbol} fundamentals…`} />
      )}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title={`Fundamentals unavailable for ${symbol}`}
          detail={state.message}
          hint="Add a Finnhub or Alpha Vantage key in SET for live fundamentals, or force the demo provider."
        />
      )}
      {f && (
        <div className="fa-page">
          <div className="panel">
            <div className="panel-title">PROFILE</div>
            <table className="kv">
              <tbody>
                <tr>
                  <td>name</td>
                  <td>{f.name ?? '—'}</td>
                </tr>
                <tr>
                  <td>exchange</td>
                  <td>{f.exchange ?? '—'}</td>
                </tr>
                <tr>
                  <td>sector</td>
                  <td>{f.sector ?? '—'}</td>
                </tr>
                <tr>
                  <td>industry</td>
                  <td>{f.industry ?? '—'}</td>
                </tr>
                <tr>
                  <td>currency</td>
                  <td>{f.currency ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="panel">
            <div className="panel-title">VALUATION & PERFORMANCE</div>
            <div className="metric-grid">
              <Metric label="MKT CAP" value={fmtLarge(f.marketCap)} />
              <Metric label="P/E (TTM)" value={fmtNum(f.peTTM, 1)} />
              <Metric label="EPS (TTM)" value={fmtNum(f.epsTTM)} />
              <Metric
                label="DIV YIELD"
                value={f.dividendYield !== undefined ? `${fmtNum(f.dividendYield)}%` : '—'}
              />
              <Metric label="BETA" value={fmtNum(f.beta)} />
              <Metric label="52W HIGH" value={fmtPrice(f.week52High)} />
              <Metric label="52W LOW" value={fmtPrice(f.week52Low)} />
              <Metric
                label="52W CHANGE"
                value={f.week52ChangePct !== undefined ? fmtPct(f.week52ChangePct) : '—'}
              />
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">PROFITABILITY & LEVERAGE</div>
            <div className="metric-grid">
              <Metric
                label="GROSS MARGIN"
                value={f.grossMarginTTM !== undefined ? `${fmtNum(f.grossMarginTTM, 1)}%` : '—'}
              />
              <Metric
                label="OP MARGIN"
                value={
                  f.operatingMarginTTM !== undefined ? `${fmtNum(f.operatingMarginTTM, 1)}%` : '—'
                }
              />
              <Metric
                label="NET MARGIN"
                value={f.netMarginTTM !== undefined ? `${fmtNum(f.netMarginTTM, 1)}%` : '—'}
              />
              <Metric
                label="ROE (TTM)"
                value={f.roeTTM !== undefined ? `${fmtNum(f.roeTTM, 1)}%` : '—'}
              />
              <Metric label="DEBT/EQUITY" value={fmtNum(f.debtToEquity)} />
            </div>
          </div>
        </div>
      )}
    </ModuleFrame>
  );
}
