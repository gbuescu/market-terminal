import type { RatingsPeriod } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

function consensus(r: RatingsPeriod): { label: string; cls: string } {
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  if (total === 0) return { label: '—', cls: 'dim' };
  const score = (r.strongBuy * 2 + r.buy - r.sell - r.strongSell * 2) / total;
  if (score > 0.8) return { label: 'STRONG BUY', cls: 'pos' };
  if (score > 0.3) return { label: 'BUY', cls: 'pos' };
  if (score < -0.8) return { label: 'STRONG SELL', cls: 'neg' };
  if (score < -0.3) return { label: 'SELL', cls: 'neg' };
  return { label: 'HOLD', cls: 'accent' };
}

function Bar({ r }: { r: RatingsPeriod }) {
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell || 1;
  const seg = (n: number, cls: string) => (
    <span
      className={`ratings-seg ${cls}`}
      style={{ width: `${(n / total) * 100}%` }}
      title={String(n)}
    />
  );
  return (
    <span className="ratings-bar">
      {seg(r.strongBuy, 'rb-sbuy')}
      {seg(r.buy, 'rb-buy')}
      {seg(r.hold, 'rb-hold')}
      {seg(r.sell, 'rb-sell')}
      {seg(r.strongSell, 'rb-ssell')}
    </span>
  );
}

export function Ratings({ tab }: { tab: Tab }) {
  const symbol = tab.symbol ?? null;
  const { state, refresh } = useEnvelope<RatingsPeriod[]>(
    symbol ? `/api/ratings?symbol=${encodeURIComponent(symbol)}` : null,
  );

  if (!symbol) {
    return (
      <ModuleFrame tab={tab}>
        <StateView
          kind="empty"
          title="No security selected"
          detail='Run the ratings command with a symbol, e.g. "AAPL AR".'
        />
      </ModuleFrame>
    );
  }

  const latest = state.status === 'ready' ? state.env.data[0] : null;

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
        <StateView kind="loading" title={`Loading ${symbol} ratings…`} />
      )}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title={`Ratings unavailable for ${symbol}`}
          detail={state.message}
          hint="Add a free Finnhub key in SET for live analyst recommendation trends."
        />
      )}
      {latest && (
        <>
          <div className="panel ratings-consensus">
            <div className="panel-title">CONSENSUS ({latest.period})</div>
            <span className={`ratings-label ${consensus(latest).cls}`}>
              {consensus(latest).label}
            </span>
            <span className="dim small">
              {latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell}{' '}
              analysts · price targets are premium on free tiers and not shown
            </span>
          </div>
          <table className="grid-table research-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Distribution</th>
                <th className="num pos">SB</th>
                <th className="num pos">B</th>
                <th className="num">H</th>
                <th className="num neg">S</th>
                <th className="num neg">SS</th>
              </tr>
            </thead>
            <tbody>
              {state.status === 'ready' &&
                state.env.data.map((r) => (
                  <tr key={r.period}>
                    <td className="dim">{r.period.slice(0, 7)}</td>
                    <td className="ratings-cell">
                      <Bar r={r} />
                    </td>
                    <td className="num">{r.strongBuy}</td>
                    <td className="num">{r.buy}</td>
                    <td className="num">{r.hold}</td>
                    <td className="num">{r.sell}</td>
                    <td className="num">{r.strongSell}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </ModuleFrame>
  );
}
