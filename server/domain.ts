/**
 * CRUD routes for persisted workspace objects: watchlists, notes, alerts.
 * These are local user data (not market data), so responses are plain JSON
 * rather than provider envelopes.
 */
import { Router } from 'express';
import type { Alert, Note, Watchlist, WatchlistItem } from '../shared/types.ts';
import { evaluateAlerts } from './alerts.ts';
import { db } from './db.ts';

export const domain = Router();

const SYMBOL_RE = /^[A-Z0-9.\-:^=/]{1,15}$/;

function id(param: string): number | null {
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function cleanSymbol(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().toUpperCase();
  return SYMBOL_RE.test(s) ? s : null;
}

// ---------- watchlists ----------

interface WatchlistRow {
  id: number;
  name: string;
  created_at: string;
}

interface ItemRow {
  id: number;
  watchlist_id: number;
  symbol: string;
  name: string | null;
  position: number;
  added_at: string;
}

function watchlistsWithItems(): Watchlist[] {
  const lists = db
    .prepare('SELECT * FROM watchlists ORDER BY name')
    .all() as unknown as WatchlistRow[];
  const items = db
    .prepare('SELECT * FROM watchlist_items ORDER BY position, id')
    .all() as unknown as ItemRow[];
  return lists.map((l) => ({
    id: l.id,
    name: l.name,
    createdAt: l.created_at,
    items: items
      .filter((i) => i.watchlist_id === l.id)
      .map(
        (i): WatchlistItem => ({
          id: i.id,
          symbol: i.symbol,
          name: i.name,
          position: i.position,
          addedAt: i.added_at,
        }),
      ),
  }));
}

domain.get('/watchlists', (_req, res) => {
  res.json(watchlistsWithItems());
});

domain.post('/watchlists', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 40) : '';
  if (!name) {
    res.status(400).json({ error: 'name required' });
    return;
  }
  try {
    const r = db.prepare('INSERT INTO watchlists (name) VALUES (?)').run(name);
    res.status(201).json({ id: Number(r.lastInsertRowid), name });
  } catch {
    res.status(409).json({ error: 'a watchlist with that name already exists' });
  }
});

domain.delete('/watchlists/:id', (req, res) => {
  const wid = id(req.params.id);
  if (!wid) {
    res.status(400).json({ error: 'bad id' });
    return;
  }
  db.prepare('DELETE FROM watchlists WHERE id = ?').run(wid);
  res.json({ ok: true });
});

domain.post('/watchlists/:id/items', (req, res) => {
  const wid = id(req.params.id);
  const symbol = cleanSymbol(req.body?.symbol);
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 80) : null;
  if (!wid || !symbol) {
    res.status(400).json({ error: 'watchlist id and valid symbol required' });
    return;
  }
  const exists = db.prepare('SELECT id FROM watchlists WHERE id = ?').get(wid);
  if (!exists) {
    res.status(404).json({ error: 'watchlist not found' });
    return;
  }
  const max = db
    .prepare('SELECT COALESCE(MAX(position), -1) AS p FROM watchlist_items WHERE watchlist_id = ?')
    .get(wid) as { p: number };
  try {
    db.prepare(
      'INSERT INTO watchlist_items (watchlist_id, symbol, name, position) VALUES (?, ?, ?, ?)',
    ).run(wid, symbol, name, max.p + 1);
    res.status(201).json({ ok: true });
  } catch {
    res.status(409).json({ error: `${symbol} is already on this list` });
  }
});

domain.delete('/watchlists/:id/items/:symbol', (req, res) => {
  const wid = id(req.params.id);
  const symbol = cleanSymbol(req.params.symbol);
  if (!wid || !symbol) {
    res.status(400).json({ error: 'bad request' });
    return;
  }
  db.prepare('DELETE FROM watchlist_items WHERE watchlist_id = ? AND symbol = ?').run(wid, symbol);
  res.json({ ok: true });
});

// ---------- notes ----------

interface NoteRow {
  id: number;
  symbol: string | null;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

function toNote(r: NoteRow): Note {
  return {
    id: r.id,
    symbol: r.symbol,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

domain.get('/notes', (req, res) => {
  const symbol = req.query.symbol !== undefined ? cleanSymbol(req.query.symbol) : undefined;
  const rows = (symbol !== undefined
    ? db.prepare('SELECT * FROM notes WHERE symbol = ? ORDER BY updated_at DESC').all(symbol)
    : db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all()) as unknown as NoteRow[];
  res.json(rows.map(toNote));
});

domain.post('/notes', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 120) : '';
  const body = typeof req.body?.body === 'string' ? req.body.body.slice(0, 20_000) : '';
  const symbol = req.body?.symbol ? cleanSymbol(req.body.symbol) : null;
  if (!title) {
    res.status(400).json({ error: 'title required' });
    return;
  }
  const r = db
    .prepare('INSERT INTO notes (symbol, title, body) VALUES (?, ?, ?)')
    .run(symbol, title, body);
  const row = db
    .prepare('SELECT * FROM notes WHERE id = ?')
    .get(Number(r.lastInsertRowid)) as unknown as NoteRow;
  res.status(201).json(toNote(row));
});

domain.put('/notes/:id', (req, res) => {
  const nid = id(req.params.id);
  const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 120) : '';
  const body = typeof req.body?.body === 'string' ? req.body.body.slice(0, 20_000) : '';
  if (!nid || !title) {
    res.status(400).json({ error: 'id and title required' });
    return;
  }
  const r = db
    .prepare("UPDATE notes SET title = ?, body = ?, updated_at = datetime('now') WHERE id = ?")
    .run(title, body, nid);
  if (r.changes === 0) {
    res.status(404).json({ error: 'note not found' });
    return;
  }
  res.json({ ok: true });
});

domain.delete('/notes/:id', (req, res) => {
  const nid = id(req.params.id);
  if (!nid) {
    res.status(400).json({ error: 'bad id' });
    return;
  }
  db.prepare('DELETE FROM notes WHERE id = ?').run(nid);
  res.json({ ok: true });
});

// ---------- alerts (notify-only) ----------

interface AlertRow {
  id: number;
  symbol: string;
  condition: 'above' | 'below';
  level: number;
  note: string | null;
  status: 'active' | 'triggered' | 'dismissed';
  created_at: string;
  triggered_at: string | null;
  triggered_price: number | null;
}

function toAlert(r: AlertRow): Alert {
  return {
    id: r.id,
    symbol: r.symbol,
    condition: r.condition,
    level: r.level,
    note: r.note,
    status: r.status,
    createdAt: r.created_at,
    triggeredAt: r.triggered_at,
    triggeredPrice: r.triggered_price,
  };
}

domain.get('/alerts', (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM alerts WHERE status != 'dismissed' ORDER BY created_at DESC")
    .all() as unknown as AlertRow[];
  res.json(rows.map(toAlert));
});

domain.post('/alerts', (req, res) => {
  const symbol = cleanSymbol(req.body?.symbol);
  const condition =
    req.body?.condition === 'above' || req.body?.condition === 'below' ? req.body.condition : null;
  const level =
    typeof req.body?.level === 'number' && Number.isFinite(req.body.level) ? req.body.level : null;
  const note =
    typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 200) || null : null;
  if (!symbol || !condition || level === null || level <= 0) {
    res.status(400).json({ error: 'symbol, condition (above|below) and positive level required' });
    return;
  }
  const r = db
    .prepare('INSERT INTO alerts (symbol, condition, level, note) VALUES (?, ?, ?, ?)')
    .run(symbol, condition, level, note);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

domain.post('/alerts/:id/dismiss', (req, res) => {
  const aid = id(req.params.id);
  if (!aid) {
    res.status(400).json({ error: 'bad id' });
    return;
  }
  db.prepare("UPDATE alerts SET status = 'dismissed' WHERE id = ?").run(aid);
  res.json({ ok: true });
});

domain.delete('/alerts/:id', (req, res) => {
  const aid = id(req.params.id);
  if (!aid) {
    res.status(400).json({ error: 'bad id' });
    return;
  }
  db.prepare('DELETE FROM alerts WHERE id = ?').run(aid);
  res.json({ ok: true });
});

/** Manual evaluation pass (the engine also runs every 60s). */
domain.post('/alerts/evaluate', async (_req, res) => {
  const result = await evaluateAlerts();
  res.json(result);
});

// ---------- workspace layout (UI state) ----------

domain.get('/workspace', (_req, res) => {
  const row = db.prepare("SELECT value FROM ui_state WHERE key = 'layout'").get() as
    | { value: string }
    | undefined;
  if (!row) {
    res.json({ tabs: [], activeIndex: 0 });
    return;
  }
  try {
    res.json(JSON.parse(row.value));
  } catch {
    res.json({ tabs: [], activeIndex: 0 });
  }
});

domain.put('/workspace', (req, res) => {
  const body = req.body;
  if (typeof body !== 'object' || body === null || !Array.isArray(body.tabs)) {
    res.status(400).json({ error: 'expected { tabs: [], activeIndex }' });
    return;
  }
  // Cap what we persist; layout is convenience state, not a document.
  const value = JSON.stringify(body).slice(0, 20_000);
  db.prepare(
    `INSERT INTO ui_state (key, value, updated_at) VALUES ('layout', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(value);
  res.json({ ok: true });
});
