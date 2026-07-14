import { useWorkspace } from '../state/workspace';

export function TabStrip() {
  const ws = useWorkspace();
  if (ws.tabs.length === 0) return <div className="tabstrip tabstrip-empty">no open functions</div>;

  return (
    <div className="tabstrip" role="tablist">
      {ws.tabs.map((tab, i) => (
        <div key={tab.id} className={`tab${tab.id === ws.activeId ? ' tab-active' : ''}`}>
          <button
            type="button"
            className="tab-title"
            role="tab"
            aria-selected={tab.id === ws.activeId}
            onClick={() => ws.activate(tab.id)}
            onAuxClick={(e) => {
              if (e.button === 1) ws.closeTab(tab.id);
            }}
          >
            {i < 9 && <span className="tab-index">{i + 1}</span>}
            {tab.title}
          </button>
          <button
            type="button"
            className="tab-close"
            aria-label={`Close ${tab.title}`}
            onClick={() => ws.closeTab(tab.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
