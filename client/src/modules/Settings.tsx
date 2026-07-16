import { useCallback, useEffect, useState } from 'react';
import type { ProviderUsage, SettingsPayload } from '../../../shared/types';
import { getJson, putJson } from '../api/client';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { useHealth } from '../state/health';
import type { Tab } from '../state/workspace';

const CAPABILITIES = [
  'search',
  'quotes',
  'series',
  'news',
  'calendar',
  'fundamentals',
  'statements',
  'insiders',
  'ratings',
  'earnings',
  'earningscal',
  'ipo',
  'dividends',
  'holdings',
  'short',
] as const;

const KEY_FIELDS: { setting: string; label: string; hint: string }[] = [
  {
    setting: 'key.finnhub',
    label: 'Finnhub',
    hint: 'quotes+ws, insiders, ratings, earnings, IPO — finnhub.io/register',
  },
  {
    setting: 'key.marketaux',
    label: 'marketaux',
    hint: 'news + entity sentiment (100 req/day) — marketaux.com',
  },
  {
    setting: 'key.fred',
    label: 'FRED',
    hint: 'official US release calendar — fredaccount.stlouisfed.org/apikeys',
  },
  {
    setting: 'key.alphavantage',
    label: 'Alpha Vantage',
    hint: 'non-US statements backup (25 req/day) — alphavantage.co',
  },
];

interface UsagePayload {
  providers: ProviderUsage[];
  live: { connected: boolean; subscriptions: number };
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; payload: SettingsPayload };

export function Settings({ tab }: { tab: Tab }) {
  const { state: health, refresh: refreshHealth } = useHealth();
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [keyDrafts, setKeyDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const reload = useCallback(() => {
    getJson<SettingsPayload>('/api/settings')
      .then((payload) => setLoad({ status: 'ready', payload }))
      .catch((err: unknown) =>
        setLoad({
          status: 'error',
          message: err instanceof Error ? err.message : 'request failed',
        }),
      );
    getJson<UsagePayload>('/api/usage')
      .then(setUsage)
      .catch(() => setUsage(null));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    (patch: Record<string, string>, message: string) => {
      putJson('/api/settings', patch)
        .then(() => {
          setNotice(message);
          reload();
        })
        .catch(() => setNotice('save failed — is the API up?'));
    },
    [reload],
  );

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {notice && <span className="dim small">{notice}</span>}
          <button
            type="button"
            className="btn"
            onClick={() => {
              refreshHealth();
              reload();
            }}
          >
            REFRESH
          </button>
        </>
      }
    >
      <div className="settings-grid">
        <div className="panel">
          <div className="panel-title">LOCAL API</div>
          {health.status === 'loading' && <StateView kind="loading" title="Checking API…" />}
          {health.status === 'down' && (
            <StateView
              kind="error"
              title="API unreachable"
              detail={health.error}
              hint="Start it with .\run.ps1 (or npm run dev:server), then REFRESH."
            />
          )}
          {health.status === 'up' && (
            <table className="kv">
              <tbody>
                <tr>
                  <td>app</td>
                  <td>
                    {health.health.app} v{health.health.version}
                  </td>
                </tr>
                <tr>
                  <td>node</td>
                  <td>{health.health.node}</td>
                </tr>
                <tr>
                  <td>db schema</td>
                  <td>v{health.health.schemaVersion} (data\terminal.db)</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {load.status === 'loading' && (
          <div className="panel">
            <StateView kind="loading" title="Loading settings…" />
          </div>
        )}
        {load.status === 'error' && (
          <div className="panel">
            <StateView kind="error" title="Settings unavailable" detail={load.message} />
          </div>
        )}
        {load.status === 'ready' && (
          <>
            <div className="panel">
              <div className="panel-title">DATA PROVIDERS</div>
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Kind</th>
                    <th>Capabilities</th>
                    <th>Delay</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {load.payload.providers.map((p) => (
                    <tr key={p.id}>
                      <td title={p.note}>{p.name}</td>
                      <td className={p.kind === 'demo' ? 'accent' : ''}>{p.kind.toUpperCase()}</td>
                      <td className="dim">{p.capabilities.join(' ')}</td>
                      <td className="num">
                        {p.delaySeconds === 0 ? '~rt' : `≤${Math.round(p.delaySeconds / 60)}m`}
                      </td>
                      <td className={p.ready ? 'pos' : 'dim'}>{p.ready ? 'READY' : 'NO KEY'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="dim small">
                Sources and their limitations are documented in docs/DATA_PROVIDERS.md. No source
                is, or claims to be, official Bloomberg data. Demo data is synthetic and clearly
                labeled wherever it renders.
              </p>
            </div>

            <div className="panel">
              <div className="panel-title">REQUEST USAGE (FREE-TIER BUDGETS)</div>
              {usage ? (
                <>
                  <table className="grid-table">
                    <thead>
                      <tr>
                        <th>Provider</th>
                        <th className="num">Last min</th>
                        <th className="num">Last hour</th>
                        <th className="num">Today</th>
                        <th className="num">Budget/min</th>
                        <th className="num">Budget/day</th>
                        <th className="num">Left today</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.providers.map((u) => {
                        const leftDay =
                          u.perDayLimit !== null ? Math.max(0, u.perDayLimit - u.today) : null;
                        return (
                          <tr key={u.provider}>
                            <td>{u.provider}</td>
                            <td className="num">{u.lastMinute}</td>
                            <td className="num">{u.lastHour}</td>
                            <td className="num">{u.today}</td>
                            <td className="num dim">{u.perMinuteLimit ?? '∞'}</td>
                            <td className="num dim">{u.perDayLimit ?? '∞'}</td>
                            <td
                              className={`num ${leftDay !== null && leftDay < 5 ? 'neg' : 'pos'}`}
                            >
                              {leftDay ?? '∞'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="dim small">
                    Budgets sit below published free-tier limits; when one is reached the app serves
                    cached data instead of making requests. Live websocket:{' '}
                    {usage.live.connected
                      ? `connected, ${usage.live.subscriptions} symbols`
                      : 'not connected (needs a Finnhub key and an open quote view)'}
                    .
                  </p>
                </>
              ) : (
                <p className="dim small">usage unavailable</p>
              )}
            </div>

            <div className="panel">
              <div className="panel-title">PROVIDER SELECTION</div>
              <table className="kv">
                <tbody>
                  {CAPABILITIES.map((cap) => {
                    const current = load.payload.settings[`provider.${cap}`] ?? 'auto';
                    const options = load.payload.providers.filter((p) =>
                      p.capabilities.includes(cap),
                    );
                    return (
                      <tr key={cap}>
                        <td>{cap}</td>
                        <td>
                          <select
                            className="select"
                            value={current}
                            aria-label={`Provider for ${cap}`}
                            onChange={(e) =>
                              save({ [`provider.${cap}`]: e.target.value }, `${cap} provider saved`)
                            }
                          >
                            <option value="auto">auto (prefer live)</option>
                            {options.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.id}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="dim small">
                "auto" prefers live sources and never silently falls back to demo — failures show as
                errors with the option to switch here.
              </p>
            </div>

            <div className="panel">
              <div className="panel-title">API KEYS</div>
              <table className="kv">
                <tbody>
                  {KEY_FIELDS.map((f) => {
                    const saved = load.payload.settings[f.setting];
                    return (
                      <tr key={f.setting}>
                        <td>
                          {f.label}
                          <div className="dim small">{f.hint}</div>
                        </td>
                        <td>
                          <input
                            className="text-input"
                            type="password"
                            placeholder={saved ? `saved ${saved}` : 'not set'}
                            value={keyDrafts[f.setting] ?? ''}
                            aria-label={`${f.label} API key`}
                            onChange={(e) =>
                              setKeyDrafts((d) => ({ ...d, [f.setting]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="btn"
                            onClick={() => {
                              save(
                                { [f.setting]: keyDrafts[f.setting] ?? '' },
                                `${f.label} key saved`,
                              );
                              setKeyDrafts((d) => ({ ...d, [f.setting]: '' }));
                            }}
                          >
                            SAVE
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="dim small">
                Keys are stored locally in data\terminal.db and never leave this machine except in
                requests to the provider itself. Save an empty value to delete a key.
              </p>
            </div>
          </>
        )}
      </div>
    </ModuleFrame>
  );
}
