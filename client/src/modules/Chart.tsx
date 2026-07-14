import { ModuleFrame, StateView, useSimulatedLoad } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

const RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'MAX'];

export function Chart({ tab }: { tab: Tab }) {
  const loading = useSimulatedLoad();
  const toolbar = (
    <span className="chart-ranges">
      {RANGES.map((r) => (
        <button type="button" key={r} className="range-btn" disabled title="Enabled in Phase 2">
          {r}
        </button>
      ))}
    </span>
  );

  return (
    <ModuleFrame tab={tab} toolbar={tab.symbol ? toolbar : undefined}>
      {!tab.symbol ? (
        <StateView
          kind="empty"
          title="No security selected"
          detail="Run the chart command with a symbol."
          hint='Example: type "AAPL GP" in the command bar.'
        />
      ) : (
        <div className="chart-canvas">
          {loading ? (
            <StateView kind="loading" title={`Loading ${tab.symbol} series…`} />
          ) : (
            <StateView
              kind="info"
              title={`No series provider configured for ${tab.symbol}`}
              detail="Price history renders on this canvas in Phase 2."
              hint="Open SET to configure providers."
            />
          )}
        </div>
      )}
    </ModuleFrame>
  );
}
