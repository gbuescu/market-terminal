import { useEffect, useRef, useState } from 'react';
import type { Alert } from '../../../shared/types';
import { getJson } from '../api/client';
import { parse } from '../commands/parser';
import { notify } from '../lib/notify';
import { useHealth } from '../state/health';
import { useWorkspace } from '../state/workspace';

export function StatusBar() {
  const { state } = useHealth(10_000);
  const ws = useWorkspace();
  const [triggeredCount, setTriggeredCount] = useState(0);
  // Triggered alert ids already seen, so we notify only on newly-crossed ones
  // (and never for the ones that were already triggered when the app opened).
  const seenTriggered = useRef<Set<number> | null>(null);

  useEffect(() => {
    const poll = () => {
      getJson<Alert[]>('/api/alerts')
        .then((alerts) => {
          const triggered = alerts.filter((a) => a.status === 'triggered');
          setTriggeredCount(triggered.length);
          const ids = new Set(triggered.map((a) => a.id));
          if (seenTriggered.current === null) {
            seenTriggered.current = ids; // seed silently on first poll
            return;
          }
          for (const a of triggered) {
            if (!seenTriggered.current.has(a.id)) {
              notify(
                `Alert: ${a.symbol} ${a.condition === 'above' ? '≥' : '≤'} ${a.level}`,
                a.triggeredPrice != null ? `Crossed at ${a.triggeredPrice}` : 'Level crossed',
              );
            }
          }
          seenTriggered.current = ids;
        })
        .catch(() => setTriggeredCount(0));
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="statusbar">
      <span className={`conn conn-${state.status}`}>
        {state.status === 'up'
          ? `● API UP · db v${state.health.schemaVersion}`
          : state.status === 'down'
            ? '● API DOWN'
            : '● …'}
      </span>
      {triggeredCount > 0 && (
        <button
          type="button"
          className="alert-flag"
          title="Open alerts center"
          onClick={() => {
            const inv = parse('ALRT');
            if (inv) ws.execute(inv);
          }}
        >
          ⚠ {triggeredCount} ALERT{triggeredCount > 1 ? 'S' : ''} TRIGGERED
        </button>
      )}
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
