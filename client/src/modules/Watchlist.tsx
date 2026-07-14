import { ModuleFrame, StateView } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

export function Watchlist({ tab }: { tab: Tab }) {
  return (
    <ModuleFrame tab={tab}>
      <StateView
        kind="empty"
        title="No watchlists yet"
        detail="Create named lists of symbols and monitor them at a glance. Creation and persistence arrive in Phase 3."
      />
    </ModuleFrame>
  );
}
