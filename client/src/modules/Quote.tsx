import { ModuleFrame, StateView, useSimulatedLoad } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

export function Quote({ tab }: { tab: Tab }) {
  const loading = useSimulatedLoad();
  return (
    <ModuleFrame tab={tab}>
      {!tab.symbol ? (
        <StateView
          kind="empty"
          title="No security selected"
          detail="Run the quote command with a symbol."
          hint='Example: type "AAPL Q" in the command bar.'
        />
      ) : loading ? (
        <StateView kind="loading" title={`Looking up ${tab.symbol}…`} />
      ) : (
        <StateView
          kind="info"
          title={`No quote provider configured for ${tab.symbol}`}
          detail="Quotes, stats and company profile arrive with the Phase 2 data layer."
          hint="Open SET to configure providers."
        />
      )}
    </ModuleFrame>
  );
}
