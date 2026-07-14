import type { Quote as QuoteDto } from '../../../shared/types';
import { useEnvelope } from '../api/useData';
import { parse } from '../commands/parser';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtChange, fmtPct, fmtPrice, fmtTime, fmtVolume, signClass } from '../lib/format';
import { type Tab, useWorkspace } from '../state/workspace';

export function Quote({ tab }: { tab: Tab }) {
  const ws = useWorkspace();
  const symbol = tab.symbol ?? null;
  const { state, refresh } = useEnvelope<QuoteDto[]>(
    symbol ? `/api/quotes?symbols=${encodeURIComponent(symbol)}` : null,
    30_000,
  );

  const crossNav = (mnemonic: string) => {
    const inv = parse(`${symbol} ${mnemonic}`);
    if (inv) ws.execute(inv);
  };

  if (!symbol) {
    return (
      <ModuleFrame tab={tab}>
        <StateView
          kind="empty"
          title="No security selected"
          detail="Run the quote command with a symbol."
          hint='Example: type "AAPL Q" in the command bar.'
        />
      </ModuleFrame>
    );
  }

  const quote = state.status === 'ready' ? state.env.data[0] : undefined;

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {state.status === 'ready' && <DataBadge env={state.env} />}
          <button type="button" className="btn" title="Open chart" onClick={() => crossNav('GP')}>
            GP
          </button>
          <button type="button" className="btn" title="Open news" onClick={() => crossNav('N')}>
            N
          </button>
          <button type="button" className="btn" title="Set alert" onClick={() => crossNav('ALRT')}>
            ALRT
          </button>
          <button type="button" className="btn" onClick={refresh}>
            REFRESH
          </button>
        </>
      }
    >
      {state.status === 'loading' && <StateView kind="loading" title={`Looking up ${symbol}…`} />}
      {state.status === 'error' && (
        <StateView
          kind="error"
          title={`Quote unavailable for ${symbol}`}
          detail={state.message}
          hint="Verify the symbol (try searching in the command bar), or force the demo provider in SET."
        />
      )}
      {state.status === 'ready' && !quote && (
        <StateView
          kind="empty"
          title={`No data returned for ${symbol}`}
          hint="The symbol may be unknown to the current provider."
        />
      )}
      {quote && (
        <div className="quote-page">
          <div className="panel quote-main">
            <div className="quote-name">{quote.name ?? quote.symbol}</div>
            <div className="quote-price-row">
              <span className="quote-price">{fmtPrice(quote.price)}</span>
              <span className={`quote-change ${signClass(quote.change)}`}>
                {fmtChange(quote.change)} ({fmtPct(quote.changePct)})
              </span>
              {quote.currency && <span className="dim">{quote.currency}</span>}
            </div>
            <div className="dim small">as of {fmtTime(quote.ts)}</div>
          </div>
          <div className="panel">
            <div className="panel-title">SESSION</div>
            <table className="kv">
              <tbody>
                <tr>
                  <td>open</td>
                  <td className="num">{fmtPrice(quote.open)}</td>
                </tr>
                <tr>
                  <td>high</td>
                  <td className="num">{fmtPrice(quote.high)}</td>
                </tr>
                <tr>
                  <td>low</td>
                  <td className="num">{fmtPrice(quote.low)}</td>
                </tr>
                <tr>
                  <td>prev close</td>
                  <td className="num">{fmtPrice(quote.prevClose)}</td>
                </tr>
                <tr>
                  <td>volume</td>
                  <td className="num">{fmtVolume(quote.volume)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ModuleFrame>
  );
}
