import { Router } from 'express';
import { db, getMeta } from './db.ts';

export const api = Router();

api.get('/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'market-terminal',
    version: '0.1.0',
    schemaVersion: Number(getMeta('schema_version') ?? 0),
    node: process.version,
    time: new Date().toISOString(),
  });
});

api.get('/commands/recent', (_req, res) => {
  const rows = db
    .prepare('SELECT input, ran_at FROM recent_commands ORDER BY id DESC LIMIT 20')
    .all() as { input: string; ran_at: string }[];
  // Collapse duplicates, keeping most-recent order.
  const seen = new Set<string>();
  res.json(rows.filter((r) => !seen.has(r.input) && seen.add(r.input)));
});

api.post('/commands/recent', (req, res) => {
  const input =
    typeof req.body?.input === 'string' ? req.body.input.trim().toUpperCase().slice(0, 120) : '';
  if (!input) {
    res.status(400).json({ error: 'input required' });
    return;
  }
  const latest = db.prepare('SELECT input FROM recent_commands ORDER BY id DESC LIMIT 1').get() as
    | { input: string }
    | undefined;
  if (latest?.input !== input) {
    db.prepare('INSERT INTO recent_commands (input) VALUES (?)').run(input);
    db.prepare(
      'DELETE FROM recent_commands WHERE id NOT IN (SELECT id FROM recent_commands ORDER BY id DESC LIMIT 200)',
    ).run();
  }
  res.json({ ok: true });
});
