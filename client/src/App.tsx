import { useEffect, useState } from 'react';
import { CommandBar } from './components/CommandBar';
import { StateView } from './components/ModuleFrame';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { TabStrip } from './components/TabStrip';
import { MODULES } from './modules';
import { useWorkspace, WorkspaceProvider } from './state/workspace';

/** Isolated so the 1-second tick doesn't re-render the whole shell. */
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="clock">{now.toLocaleTimeString([], { hour12: false })}</span>;
}

function Workspace() {
  const ws = useWorkspace();

  // Tab shortcuts: Alt+1..9 jump, Alt+PageUp/Down cycle, Alt+W close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key >= '1' && e.key <= '9') {
        ws.activateIndex(Number(e.key) - 1);
        e.preventDefault();
      } else if (e.key === 'PageDown') {
        ws.cycle(1);
        e.preventDefault();
      } else if (e.key === 'PageUp') {
        ws.cycle(-1);
        e.preventDefault();
      } else if (e.key.toLowerCase() === 'w') {
        ws.closeActive();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ws]);

  const active = ws.activeTab;
  const ActiveModule = active ? MODULES[active.moduleId] : null;

  return (
    <div className="workspace">
      <TabStrip />
      <div className="workspace-body">
        {active && ActiveModule ? (
          <ActiveModule key={active.id} tab={active} />
        ) : (
          <StateView
            kind="empty"
            title="No open functions"
            detail="Type a command to open a module."
            hint='Try MON for markets, HELP for the cheat sheet, or "AAPL Q" for a quote.'
          />
        )}
      </div>
    </div>
  );
}

export function App() {
  return (
    <WorkspaceProvider>
      <div className="terminal">
        <header className="topbar">
          <span className="brand">MARKET TERMINAL</span>
          <span className="tag">LOCAL · READ-ONLY</span>
          <CommandBar />
          <Clock />
        </header>
        <div className="main">
          <Sidebar />
          <Workspace />
        </div>
        <StatusBar />
      </div>
    </WorkspaceProvider>
  );
}
