import { useHealth } from '../state/health';

export function StatusBar() {
  const { state } = useHealth(10_000);

  return (
    <footer className="statusbar">
      <span className={`conn conn-${state.status}`}>
        {state.status === 'up'
          ? `● API UP · db v${state.health.schemaVersion}`
          : state.status === 'down'
            ? '● API DOWN'
            : '● …'}
      </span>
      <span className="spacer" />
      <span className="status-constraint">NO TRADING · RESEARCH &amp; MONITORING ONLY</span>
      <span className="spacer" />
      <span className="status-hints">
        <kbd>/</kbd> command · <kbd>Alt+1–9</kbd> tabs · <kbd>Alt+W</kbd> close · <kbd>HELP</kbd>{' '}
        cheat sheet
      </span>
    </footer>
  );
}
