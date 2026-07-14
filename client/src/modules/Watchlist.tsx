import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Quote, Watchlist as WatchlistDto } from '../../../shared/types';
import { deleteJson, getJson, postJson } from '../api/client';
import { useEnvelope } from '../api/useData';
import { parse } from '../commands/parser';
import { DataBadge } from '../components/DataBadge';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtChange, fmtPct, fmtPrice, signClass } from '../lib/format';
import { type Tab, useWorkspace } from '../state/workspace';

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; lists: WatchlistDto[] };

export function Watchlist({ tab }: { tab: Tab }) {
  const ws = useWorkspace();
  const [state, setState] = useState<ListState>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newList, setNewList] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [notice, setNotice] = useState('');

  const reload = useCallback(() => {
    getJson<WatchlistDto[]>('/api/watchlists')
      .then((lists) => {
        setState({ status: 'ready', lists });
        setSelectedId((cur) =>
          cur && lists.some((l) => l.id === cur) ? cur : (lists[0]?.id ?? null),
        );
      })
      .catch((err: unknown) =>
        setState({ status: 'error', message: err instanceof Error ? err.message : 'failed' }),
      );
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const lists = state.status === 'ready' ? state.lists : [];
  const selected = lists.find((l) => l.id === selectedId) ?? null;
  const symbols = useMemo(() => selected?.items.map((i) => i.symbol) ?? [], [selected]);

  const { state: quotesState, refresh: refreshQuotes } = useEnvelope<Quote[]>(
    symbols.length > 0 ? `/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}` : null,
    30_000,
  );
  const quoteBySymbol = useMemo(
    () =>
      quotesState.status === 'ready'
        ? new Map(quotesState.env.data.map((q) => [q.symbol, q]))
        : new Map<string, Quote>(),
    [quotesState],
  );

  const act = useCallback(
    (fn: () => Promise<unknown>) => {
      fn()
        .then(() => {
          setNotice('');
          reload();
        })
        .catch((err: unknown) => setNotice(err instanceof Error ? err.message : 'failed'));
    },
    [reload],
  );

  const openQuote = (symbol: string) => {
    const inv = parse(`${symbol} Q`);
    if (inv) ws.execute(inv);
  };

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {notice && <span className="neg small">{notice}</span>}
          {quotesState.status === 'ready' && <DataBadge env={quotesState.env} />}
          <button
            type="button"
            className="btn"
            onClick={() => {
              reload();
              refreshQuotes();
            }}
          >
            REFRESH
          </button>
        </>
      }
    >
      {state.status === 'loading' && <StateView kind="loading" title="Loading watchlists…" />}
      {state.status === 'error' && (
        <StateView kind="error" title="Watchlists unavailable" detail={state.message} />
      )}
      {state.status === 'ready' && (
        <div className="split-page">
          <div className="split-side panel">
            <div className="panel-title">LISTS</div>
            {lists.map((l) => (
              <div key={l.id} className="side-row">
                <button
                  type="button"
                  className={`side-row-main${l.id === selectedId ? ' accent' : ''}`}
                  onClick={() => setSelectedId(l.id)}
                >
                  {l.name} <span className="dim">({l.items.length})</span>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Delete list ${l.name}`}
                  title="Delete list"
                  onClick={() => act(() => deleteJson(`/api/watchlists/${l.id}`))}
                >
                  ×
                </button>
              </div>
            ))}
            <form
              className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const name = newList.trim();
                if (!name) return;
                act(() => postJson('/api/watchlists', { name }));
                setNewList('');
              }}
            >
              <input
                className="text-input text-input-full"
                placeholder="new list name"
                value={newList}
                maxLength={40}
                aria-label="New watchlist name"
                onChange={(e) => setNewList(e.target.value)}
              />
              <button type="submit" className="btn">
                ADD
              </button>
            </form>
          </div>

          <div className="split-main">
            {!selected && (
              <StateView
                kind="empty"
                title="No watchlists yet"
                detail="Create a list on the left, then add symbols to monitor them at a glance."
              />
            )}
            {selected && (
              <>
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const symbol = newSymbol.trim().toUpperCase();
                    if (!symbol) return;
                    act(() => postJson(`/api/watchlists/${selected.id}/items`, { symbol }));
                    setNewSymbol('');
                  }}
                >
                  <input
                    className="text-input"
                    placeholder="add symbol, e.g. AAPL or ^GSPC"
                    value={newSymbol}
                    maxLength={15}
                    aria-label="Add symbol"
                    onChange={(e) => setNewSymbol(e.target.value)}
                  />
                  <button type="submit" className="btn">
                    ADD
                  </button>
                </form>
                {selected.items.length === 0 ? (
                  <StateView
                    kind="empty"
                    title={`"${selected.name}" is empty`}
                    detail="Add symbols above; live quotes appear here."
                  />
                ) : (
                  <table className="grid-table wl-table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th className="num">Last</th>
                        <th className="num">Chg</th>
                        <th className="num">Chg%</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item) => {
                        const q = quoteBySymbol.get(item.symbol);
                        return (
                          <tr key={item.id}>
                            <td>
                              <button
                                type="button"
                                className="link-btn accent"
                                title={`Open ${item.symbol} quote`}
                                onClick={() => openQuote(item.symbol)}
                              >
                                {item.symbol}
                              </button>
                            </td>
                            <td className="dim">{q?.name ?? item.name ?? '—'}</td>
                            <td className="num">{fmtPrice(q?.price)}</td>
                            <td className={`num ${signClass(q?.change)}`}>
                              {fmtChange(q?.change)}
                            </td>
                            <td className={`num ${signClass(q?.changePct)}`}>
                              {fmtPct(q?.changePct)}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="icon-btn"
                                aria-label={`Remove ${item.symbol}`}
                                title="Remove"
                                onClick={() =>
                                  act(() =>
                                    deleteJson(
                                      `/api/watchlists/${selected.id}/items/${encodeURIComponent(item.symbol)}`,
                                    ),
                                  )
                                }
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </ModuleFrame>
  );
}
