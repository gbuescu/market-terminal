import { ModuleFrame, StateView } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

export function Alerts({ tab }: { tab: Tab }) {
  return (
    <ModuleFrame tab={tab}>
      <StateView
        kind="empty"
        title="No alerts defined"
        detail="Price and level alerts arrive in Phase 3. Alerts notify only — this terminal never places, routes or simulates orders."
      />
    </ModuleFrame>
  );
}
