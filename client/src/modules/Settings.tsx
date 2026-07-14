import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { useHealth } from '../state/health';
import type { Tab } from '../state/workspace';

/** Candidate providers — mirrors docs/DATA_PROVIDERS.md; wiring is Phase 2. */
const PROVIDERS = [
  { name: 'Demo / seed data', data: 'Everything (clearly labeled)', key: 'none' },
  { name: 'Stooq', data: 'EOD prices, indices, FX', key: 'none' },
  { name: 'Yahoo Finance (unofficial)', data: 'Quotes, charts, fundamentals', key: 'none' },
  { name: 'Alpha Vantage', data: 'Quotes, series, FX', key: 'required' },
  { name: 'Finnhub', data: 'Quotes, news, calendar', key: 'required' },
  { name: 'FRED', data: 'US macro series', key: 'required (free)' },
  { name: 'CoinGecko', data: 'Crypto', key: 'none' },
];

export function Settings({ tab }: { tab: Tab }) {
  const { state, refresh } = useHealth();

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <button type="button" className="btn" onClick={refresh}>
          REFRESH
        </button>
      }
    >
      <div className="settings-grid">
        <div className="panel">
          <div className="panel-title">LOCAL API</div>
          {state.status === 'loading' && <StateView kind="loading" title="Checking API…" />}
          {state.status === 'down' && (
            <StateView
              kind="error"
              title="API unreachable"
              detail={state.error}
              hint="Start it with .\run.ps1 (or npm run dev:server), then REFRESH."
            />
          )}
          {state.status === 'up' && (
            <table className="kv">
              <tbody>
                <tr>
                  <td>app</td>
                  <td>
                    {state.health.app} v{state.health.version}
                  </td>
                </tr>
                <tr>
                  <td>node</td>
                  <td>{state.health.node}</td>
                </tr>
                <tr>
                  <td>db schema</td>
                  <td>v{state.health.schemaVersion} (data\terminal.db)</td>
                </tr>
                <tr>
                  <td>server time</td>
                  <td>{state.health.time}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">DATA PROVIDERS</div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Data</th>
                <th>API key</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDERS.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.data}</td>
                  <td>{p.key}</td>
                  <td className="dim">NOT CONFIGURED — Phase 2</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dim small">
            Key entry and provider selection activate with the Phase 2 data layer. The terminal
            stays fully usable without keys via clearly-labeled demo data. No source is, or claims
            to be, official Bloomberg data.
          </p>
        </div>
      </div>
    </ModuleFrame>
  );
}
