import type { InsiderTx } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtPrice, fmtVolume, signClass } from '../lib/format';
import type { Tab } from '../state/workspace';

const CODE_LABEL: Record<string, string> = {
  P: 'BUY',
  S: 'SELL',
  A: 'AWARD',
  M: 'EXERCISE',
  G: 'GIFT',
  F: 'TAX',
};

export function Insiders({ tab }: { tab: Tab }) {
  const symbol = tab.symbol ?? null;
  const { state, refresh } = useEnvelope<InsiderTx[]>(
    symbol ? `/api/insiders?symbol=${encodeURIComponent(symbol)}` : null,
  );

  if (!symbol) {
    return (
      <ModuleFrame tab={tab}>
        <StateView
          kind="empty"
          title="No security selected"
          detail='Run the insiders command with a symbol, e.g. "AAPL INS".'
        />
      </ModuleFrame>
    );
  }

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
        <StateView kind="loading" title={`Loading ${symbol} insider transactions…`} />
      )}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title={`Insider data unavailable for ${symbol}`}
          detail={state.message}
          hint="Add a free Finnhub key in SET for live insider filings."
        />
      )}
      {state.status === 'ready' && state.env.data.length === 0 && (
        <StateView kind="empty" title={`No recent insider transactions for ${symbol}`} />
      )}
      {state.status === 'ready' && state.env.data.length > 0 && (
        <table className="grid-table research-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Insider</th>
              <th>Type</th>
              <th className="num">Shares Δ</th>
              <th className="num">Price</th>
              <th className="num">Held after</th>
            </tr>
          </thead>
          <tbody>
            {state.env.data.map((t) => (
              <tr key={`${t.name}|${t.date}|${t.change}|${t.price ?? ''}`}>
                <td className="dim">{t.date}</td>
                <td>{t.name}</td>
                <td className={t.change >= 0 ? 'pos' : 'neg'}>
                  {CODE_LABEL[t.code ?? ''] ?? t.code ?? (t.change >= 0 ? 'ACQ' : 'DISP')}
                </td>
                <td className={`num ${signClass(t.change)}`}>
                  {t.change >= 0 ? '+' : ''}
                  {fmtVolume(Math.abs(t.change))}
                </td>
                <td className="num">{fmtPrice(t.price)}</td>
                <td className="num dim">{fmtVolume(t.sharesHeld)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModuleFrame>
  );
}
