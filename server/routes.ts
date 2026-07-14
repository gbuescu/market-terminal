import { Router } from 'express';
import type { Range } from '../shared/types.ts';
import { RANGES } from '../shared/types.ts';
import { type CacheHit, getOrFetch } from './cache.ts';
import { db, getMeta } from './db.ts';
import { describeProviders, pickProviders } from './providers/registry.ts';
import { type Capability, type Provider, Unsupported } from './providers/types.ts';
import { isSettingKey, maskedSettings, setSetting } from './settings.ts';

export const api = Router();

const SYMBOL_RE = /^[A-Z0-9.\-:^=/]{1,15}$/;

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

// ---------- command history ----------

api.get('/commands/recent', (_req, res) => {
  const rows = db
    .prepare('SELECT input, ran_at FROM recent_commands ORDER BY id DESC LIMIT 20')
    .all() as { input: string; ran_at: string }[];
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

// ---------- data envelope plumbing ----------

/**
 * Runs `fn` against the ordered providers for a capability, falling through
 * only on Unsupported, and wraps the (cached) result in the standard
 * envelope. Real fetch failures surface as HTTP 502 unless the cache layer
 * already served a stale copy.
 */
async function serveData<T>(
  cap: Capability,
  cacheKeyPart: string,
  ttlMs: number,
  fn: (p: Provider) => Promise<T>,
): Promise<{ status: number; body: unknown }> {
  const providers = pickProviders(cap);
  if (providers.length === 0) {
    return { status: 503, body: { error: `no provider available for ${cap}` } };
  }
  let lastError: unknown = null;
  for (const p of providers) {
    try {
      const hit: CacheHit<T> = await getOrFetch(`${cap}:${p.id}:${cacheKeyPart}`, ttlMs, () =>
        fn(p),
      );
      return {
        status: 200,
        body: {
          data: hit.data,
          source: p.id,
          asOf: new Date(hit.fetchedAt).toISOString(),
          delayed: p.delaySeconds > 60,
          fromCache: hit.fromCache,
          stale: hit.stale,
          demo: p.kind === 'demo',
        },
      };
    } catch (err) {
      if (err instanceof Unsupported) continue;
      lastError = err;
      break; // never silently fall through to another (e.g. demo) source
    }
  }
  const msg = lastError instanceof Error ? lastError.message : 'provider request failed';
  return { status: 502, body: { error: msg } };
}

function parseSymbols(raw: unknown, max: number): string[] | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const symbols = raw
    .toUpperCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (symbols.length === 0 || symbols.length > max) return null;
  return symbols.every((s) => SYMBOL_RE.test(s)) ? symbols : null;
}

// ---------- data routes ----------

api.get('/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
  if (q.length < 2) {
    res.status(400).json({ error: 'q must be at least 2 characters' });
    return;
  }
  const r = await serveData('search', q.toUpperCase(), 86_400_000, (p) => {
    if (!p.search) throw new Unsupported();
    return p.search(q);
  });
  res.status(r.status).json(r.body);
});

api.get('/quotes', async (req, res) => {
  const symbols = parseSymbols(req.query.symbols, 25);
  if (!symbols) {
    res.status(400).json({ error: 'symbols must be 1-25 comma-separated tickers' });
    return;
  }
  const r = await serveData('quotes', symbols.join(','), 30_000, (p) => {
    if (!p.quotes) throw new Unsupported();
    return p.quotes(symbols);
  });
  res.status(r.status).json(r.body);
});

api.get('/series', async (req, res) => {
  const symbols = parseSymbols(req.query.symbol, 1);
  const range = typeof req.query.range === 'string' ? req.query.range.toUpperCase() : '';
  if (!symbols || !(RANGES as readonly string[]).includes(range)) {
    res.status(400).json({ error: `symbol required; range must be one of ${RANGES.join(',')}` });
    return;
  }
  const ttl = range === '1D' ? 300_000 : 900_000;
  const r = await serveData('series', `${symbols[0]}:${range}`, ttl, (p) => {
    if (!p.series) throw new Unsupported();
    return p.series(symbols[0], range as Range);
  });
  res.status(r.status).json(r.body);
});

api.get('/news', async (req, res) => {
  const symbol = req.query.symbol !== undefined ? parseSymbols(req.query.symbol, 1) : undefined;
  if (symbol === null) {
    res.status(400).json({ error: 'invalid symbol' });
    return;
  }
  const r = await serveData('news', symbol?.[0] ?? '*', 300_000, (p) => {
    if (!p.news) throw new Unsupported();
    return p.news(symbol?.[0]);
  });
  res.status(r.status).json(r.body);
});

api.get('/calendar', async (_req, res) => {
  const r = await serveData('calendar', '*', 21_600_000, (p) => {
    if (!p.calendar) throw new Unsupported();
    return p.calendar();
  });
  res.status(r.status).json(r.body);
});

// ---------- settings ----------

api.get('/settings', (_req, res) => {
  res.json({ settings: maskedSettings(), providers: describeProviders() });
});

api.put('/settings', (req, res) => {
  const body = req.body;
  if (typeof body !== 'object' || body === null) {
    res.status(400).json({ error: 'object body required' });
    return;
  }
  const rejected: string[] = [];
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (isSettingKey(key) && typeof value === 'string' && value.length <= 200) {
      setSetting(key, value.trim());
    } else {
      rejected.push(key);
    }
  }
  res.json({ ok: true, rejected });
});
