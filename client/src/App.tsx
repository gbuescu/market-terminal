import { useEffect, useState } from 'react';

interface Health {
  ok: boolean;
  app: string;
  version: string;
  schemaVersion: number;
  node: string;
  time: string;
}

type ConnState = { status: 'connecting' } | { status: 'up'; health: Health } | { status: 'down' };

export function App() {
  const [conn, setConn] = useState<ConnState>({ status: 'connecting' });
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error(`http ${res.status}`);
        const health = (await res.json()) as Health;
        if (!cancelled) setConn({ status: 'up', health });
      } catch {
        if (!cancelled) setConn({ status: 'down' });
      }
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="terminal">
      <header className="topbar">
        <span className="brand">MARKET TERMINAL</span>
        <span className="tag">LOCAL · READ-ONLY</span>
        <span className="spacer" />
        <span className="clock">{clock.toLocaleTimeString([], { hour12: false })}</span>
        <span className={`conn conn-${conn.status}`}>
          {conn.status === 'up' ? '● API UP' : conn.status === 'down' ? '● API DOWN' : '● …'}
        </span>
      </header>

      <main className="workspace">
        <div className="panel">
          <div className="panel-title">PHASE 0 — SCAFFOLD</div>
          <p>
            Foundation is up: Vite + React client, Express API, SQLite persistence. The terminal
            shell (command bar, tabs, modules) arrives in Phase 1.
          </p>
          {conn.status === 'up' && (
            <table className="kv">
              <tbody>
                <tr>
                  <td>app</td>
                  <td>
                    {conn.health.app} v{conn.health.version}
                  </td>
                </tr>
                <tr>
                  <td>db schema</td>
                  <td>{conn.health.schemaVersion}</td>
                </tr>
                <tr>
                  <td>node</td>
                  <td>{conn.health.node}</td>
                </tr>
                <tr>
                  <td>server time</td>
                  <td>{conn.health.time}</td>
                </tr>
              </tbody>
            </table>
          )}
          {conn.status === 'down' && (
            <p className="err">
              API unreachable on :4780 — start it with <code>npm run dev:server</code> or{' '}
              <code>.\run.ps1</code>.
            </p>
          )}
        </div>
      </main>

      <footer className="statusbar">
        <span>NO TRADING · RESEARCH &amp; MONITORING ONLY</span>
        <span className="spacer" />
        <span>market-terminal v0.1.0</span>
      </footer>
    </div>
  );
}
