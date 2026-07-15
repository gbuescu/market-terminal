import { useCallback, useEffect, useState } from 'react';
import type { Alert, AlertCondition } from '../../../shared/types';
import { deleteJson, getJson, postJson } from '../api/client';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtDateTime, fmtPrice } from '../lib/format';
import {
  type NotifyPermission,
  notificationPermission,
  requestNotificationPermission,
} from '../lib/notify';
import type { Tab } from '../state/workspace';

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; alerts: Alert[] };

export function Alerts({ tab }: { tab: Tab }) {
  const [state, setState] = useState<ListState>({ status: 'loading' });
  const [symbol, setSymbol] = useState(tab.symbol ?? '');
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [level, setLevel] = useState('');
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState('');
  const [perm, setPerm] = useState<NotifyPermission>(() => notificationPermission());

  const reload = useCallback(() => {
    getJson<Alert[]>('/api/alerts')
      .then((alerts) => setState({ status: 'ready', alerts }))
      .catch((err: unknown) =>
        setState({ status: 'error', message: err instanceof Error ? err.message : 'failed' }),
      );
  }, []);

  useEffect(() => {
    reload();
    const id = setInterval(reload, 30_000);
    return () => clearInterval(id);
  }, [reload]);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const lvl = Number(level);
    if (!symbol.trim() || !Number.isFinite(lvl) || lvl <= 0) {
      setNotice('symbol and a positive level are required');
      return;
    }
    postJson('/api/alerts', {
      symbol: symbol.trim().toUpperCase(),
      condition,
      level: lvl,
      note: note.trim() || undefined,
    })
      .then(() => {
        setNotice('alert created');
        setLevel('');
        setNote('');
        reload();
      })
      .catch((err: unknown) => setNotice(err instanceof Error ? err.message : 'create failed'));
  };

  const alerts = state.status === 'ready' ? state.alerts : [];
  const active = alerts.filter((a) => a.status === 'active');
  const triggered = alerts.filter((a) => a.status === 'triggered');

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {notice && <span className="dim small">{notice}</span>}
          {perm !== 'unsupported' &&
            (perm === 'granted' ? (
              <span className="dim small">🔔 notifications on</span>
            ) : (
              <button
                type="button"
                className="btn"
                title="Get a desktop notification when an alert triggers"
                onClick={() => requestNotificationPermission().then(setPerm)}
              >
                ENABLE NOTIFICATIONS
              </button>
            ))}
          <button type="button" className="btn" onClick={reload}>
            REFRESH
          </button>
        </>
      }
    >
      <p className="dim small alerts-disclaimer">
        Alerts notify only. They are checked about once a minute against the configured quote
        provider and never place, route or simulate orders.
      </p>

      <form className="inline-form alert-form" onSubmit={create}>
        <input
          className="text-input"
          placeholder="symbol e.g. AAPL"
          value={symbol}
          maxLength={15}
          aria-label="Alert symbol"
          onChange={(e) => setSymbol(e.target.value)}
        />
        <select
          className="select"
          value={condition}
          aria-label="Alert condition"
          onChange={(e) => setCondition(e.target.value as AlertCondition)}
        >
          <option value="above">at or above</option>
          <option value="below">at or below</option>
        </select>
        <input
          className="text-input"
          placeholder="level e.g. 320.50"
          value={level}
          inputMode="decimal"
          aria-label="Alert level"
          onChange={(e) => setLevel(e.target.value)}
        />
        <input
          className="text-input"
          placeholder="note (optional)"
          value={note}
          maxLength={200}
          aria-label="Alert note"
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit" className="btn">
          CREATE ALERT
        </button>
      </form>

      {state.status === 'loading' && <StateView kind="loading" title="Loading alerts…" />}
      {state.status === 'error' && (
        <StateView kind="error" title="Alerts unavailable" detail={state.message} />
      )}
      {state.status === 'ready' && (
        <div className="alerts-columns">
          <div className="panel">
            <div className="panel-title">ACTIVE ({active.length})</div>
            {active.length === 0 ? (
              <p className="dim small">No active alerts. Create one above.</p>
            ) : (
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Condition</th>
                    <th>Note</th>
                    <th>Created</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {active.map((a) => (
                    <tr key={a.id}>
                      <td className="accent">{a.symbol}</td>
                      <td className="num">
                        {a.condition === 'above' ? '≥' : '≤'} {fmtPrice(a.level)}
                      </td>
                      <td className="dim">{a.note ?? ''}</td>
                      <td className="dim">{fmtDateTime(a.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Delete alert on ${a.symbol}`}
                          title="Delete"
                          onClick={() => deleteJson(`/api/alerts/${a.id}`).then(reload)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel">
            <div className="panel-title">TRIGGERED ({triggered.length})</div>
            {triggered.length === 0 ? (
              <p className="dim small">Nothing triggered.</p>
            ) : (
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Condition</th>
                    <th className="num">At price</th>
                    <th>When</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {triggered.map((a) => (
                    <tr key={a.id}>
                      <td className="accent">{a.symbol}</td>
                      <td className="num">
                        {a.condition === 'above' ? '≥' : '≤'} {fmtPrice(a.level)}
                      </td>
                      <td className="num pos">{fmtPrice(a.triggeredPrice ?? undefined)}</td>
                      <td className="dim">{a.triggeredAt ? fmtDateTime(a.triggeredAt) : '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => postJson(`/api/alerts/${a.id}/dismiss`).then(reload)}
                        >
                          DISMISS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </ModuleFrame>
  );
}
