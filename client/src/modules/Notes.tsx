import { ModuleFrame, StateView } from '../components/ModuleFrame';
import type { Tab } from '../state/workspace';

export function Notes({ tab }: { tab: Tab }) {
  return (
    <ModuleFrame tab={tab}>
      <StateView
        kind="empty"
        title={tab.symbol ? `No notes for ${tab.symbol}` : 'No notes yet'}
        detail="Research notes with symbol linking arrive in Phase 3, persisted locally in SQLite."
      />
    </ModuleFrame>
  );
}
