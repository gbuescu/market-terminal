import { ModuleFrame, StateView, useSimulatedLoad } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

export function Calendar({ tab }: { tab: Tab }) {
  const loading = useSimulatedLoad();
  return (
    <ModuleFrame tab={tab}>
      {loading ? (
        <StateView kind="loading" title="Loading calendar…" />
      ) : (
        <StateView
          kind="info"
          title="No calendar provider configured"
          detail="Macro releases, central-bank decisions and earnings dates arrive in Phase 2 (FRED and friends)."
          hint="Open SET to configure providers."
        />
      )}
    </ModuleFrame>
  );
}
