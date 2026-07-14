import { ModuleFrame, StateView, useSimulatedLoad } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

export function News({ tab }: { tab: Tab }) {
  const loading = useSimulatedLoad();
  return (
    <ModuleFrame tab={tab}>
      {loading ? (
        <StateView kind="loading" title="Fetching headlines…" />
      ) : (
        <StateView
          kind="info"
          title={
            tab.symbol
              ? `No news provider configured for ${tab.symbol}`
              : 'No news provider configured'
          }
          detail="Market-wide and per-symbol headlines stream here in Phase 2."
          hint="Open SET to configure providers."
        />
      )}
    </ModuleFrame>
  );
}
