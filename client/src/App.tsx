import { useEffect, useState } from 'react';
import { parse } from './commands/parser';
import { CommandBar } from './components/CommandBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StateView } from './components/ModuleFrame';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { TabStrip } from './components/TabStrip';
import { MODULES } from './modules';
import { StudentProvider, useStudent } from './state/student';
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
          <ErrorBoundary resetKey={active.id}>
            <ActiveModule key={active.id} tab={active} />
          </ErrorBoundary>
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

/** First-run hint strip; disappears once the tour is done or dismissed. */
function OnboardingBanner() {
  const ws = useWorkspace();
  const { onboarded, dismissOnboarding } = useStudent();
  if (onboarded) return null;
  return (
    <div className="onboarding">
      <span>
        New here? <span className="accent">LEARN</span> gives you a five-minute tour of the terminal
        and its command language.
      </span>
      <button
        type="button"
        className="btn"
        onClick={() => {
          const inv = parse('LEARN');
          if (inv) ws.execute(inv);
        }}
      >
        START TOUR
      </button>
      <button type="button" className="btn" onClick={dismissOnboarding}>
        DISMISS
      </button>
    </div>
  );
}

function StudentTag() {
  const { studentMode } = useStudent();
  if (!studentMode) return null;
  return <span className="tag tag-student">STUDENT</span>;
}

export function App() {
  return (
    <StudentProvider>
      <WorkspaceProvider>
        <div className="terminal">
          <header className="topbar">
            <span className="brand">MARKET TERMINAL</span>
            <span className="tag">LOCAL · READ-ONLY</span>
            <StudentTag />
            <CommandBar />
            <Clock />
          </header>
          <OnboardingBanner />
          <div className="main">
            <Sidebar />
            <Workspace />
          </div>
          <StatusBar />
        </div>
      </WorkspaceProvider>
    </StudentProvider>
  );
}
