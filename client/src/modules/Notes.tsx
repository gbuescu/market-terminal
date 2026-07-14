import { useCallback, useEffect, useState } from 'react';
import type { Note } from '../../../shared/types';
import { deleteJson, getJson, postJson, putJson } from '../api/client';
import { ModuleFrame, StateView } from '../components/ModuleFrame';
import { fmtDateTime } from '../lib/format';
import type { Tab } from '../state/workspace';

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; notes: Note[] };

export function Notes({ tab }: { tab: Tab }) {
  const [state, setState] = useState<ListState>({ status: 'loading' });
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');

  const qs = tab.symbol ? `?symbol=${encodeURIComponent(tab.symbol)}` : '';

  const reload = useCallback(() => {
    getJson<Note[]>(`/api/notes${qs}`)
      .then((notes) => setState({ status: 'ready', notes }))
      .catch((err: unknown) =>
        setState({ status: 'error', message: err instanceof Error ? err.message : 'failed' }),
      );
  }, [qs]);

  useEffect(() => {
    reload();
  }, [reload]);

  const notes = state.status === 'ready' ? state.notes : [];

  const startNew = () => {
    setEditingId('new');
    setTitle(tab.symbol ? `${tab.symbol}: ` : '');
    setBody('');
  };

  const startEdit = (n: Note) => {
    setEditingId(n.id);
    setTitle(n.title);
    setBody(n.body);
  };

  const save = () => {
    const t = title.trim();
    if (!t || editingId === null) return;
    const op =
      editingId === 'new'
        ? postJson('/api/notes', { title: t, body, symbol: tab.symbol })
        : putJson(`/api/notes/${editingId}`, { title: t, body });
    op.then(() => {
      setNotice('saved');
      setEditingId(null);
      reload();
    }).catch((err: unknown) => setNotice(err instanceof Error ? err.message : 'save failed'));
  };

  const remove = (id: number) => {
    deleteJson(`/api/notes/${id}`)
      .then(() => {
        if (editingId === id) setEditingId(null);
        reload();
      })
      .catch(() => setNotice('delete failed'));
  };

  return (
    <ModuleFrame
      tab={tab}
      toolbar={
        <>
          {notice && <span className="dim small">{notice}</span>}
          <button type="button" className="btn" onClick={startNew}>
            NEW NOTE
          </button>
        </>
      }
    >
      {state.status === 'loading' && <StateView kind="loading" title="Loading notes…" />}
      {state.status === 'error' && (
        <StateView kind="error" title="Notes unavailable" detail={state.message} />
      )}
      {state.status === 'ready' && (
        <div className="split-page">
          <div className="split-side panel">
            <div className="panel-title">{tab.symbol ? `${tab.symbol} NOTES` : 'ALL NOTES'}</div>
            {notes.length === 0 && (
              <p className="dim small">
                {tab.symbol ? `No notes for ${tab.symbol} yet.` : 'No notes yet.'} Use NEW NOTE.
              </p>
            )}
            {notes.map((n) => (
              <div key={n.id} className="side-row">
                <button
                  type="button"
                  className={`side-row-main${editingId === n.id ? ' accent' : ''}`}
                  onClick={() => startEdit(n)}
                >
                  <span className="note-title">{n.title}</span>
                  <span className="dim small">
                    {n.symbol ? `${n.symbol} · ` : ''}
                    {fmtDateTime(n.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Delete note ${n.title}`}
                  title="Delete"
                  onClick={() => remove(n.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="split-main">
            {editingId === null ? (
              <StateView
                kind="empty"
                title="No note open"
                detail="Select a note on the left or create a new one."
                hint="Notes live locally in SQLite — nothing leaves this machine."
              />
            ) : (
              <div className="note-editor">
                <input
                  className="text-input text-input-full"
                  placeholder="Title"
                  value={title}
                  maxLength={120}
                  aria-label="Note title"
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className="note-body"
                  placeholder="Write your research note…"
                  value={body}
                  aria-label="Note body"
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className="inline-form">
                  <button type="button" className="btn" onClick={save}>
                    SAVE
                  </button>
                  <button type="button" className="btn" onClick={() => setEditingId(null)}>
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ModuleFrame>
  );
}
