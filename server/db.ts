/**
 * SQLite persistence via the Node built-in node:sqlite module (Node >= 24).
 * No native npm modules — this keeps Windows setup dependency-free.
 *
 * Migration model: `migrations` is an append-only array of SQL scripts.
 * meta.schema_version records how many have been applied. Never edit or
 * reorder an entry that has shipped — append a new one.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, 'terminal.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);');

const migrations: string[] = [
  // 001 — settings + recent command history. Domain tables (watchlists,
  // alerts, notes, layouts) are added in later phases once their shape is known.
  `CREATE TABLE settings (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL,
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE recent_commands (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     input TEXT NOT NULL,
     ran_at TEXT NOT NULL DEFAULT (datetime('now'))
   );`,
  // 002 — provider response cache (TTL-based; see server/cache.ts)
  `CREATE TABLE cache (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL,
     fetched_at INTEGER NOT NULL,
     ttl_ms INTEGER NOT NULL
   );`,
  // 003 — persisted workspace objects: watchlists, notes, alerts.
  // Alerts are notify-only by design; there is deliberately no order/trade
  // shape anywhere in this schema.
  `CREATE TABLE watchlists (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL UNIQUE,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE watchlist_items (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     watchlist_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
     symbol TEXT NOT NULL,
     name TEXT,
     position INTEGER NOT NULL DEFAULT 0,
     added_at TEXT NOT NULL DEFAULT (datetime('now')),
     UNIQUE (watchlist_id, symbol)
   );
   CREATE TABLE notes (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     symbol TEXT,
     title TEXT NOT NULL,
     body TEXT NOT NULL DEFAULT '',
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE alerts (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     symbol TEXT NOT NULL,
     condition TEXT NOT NULL CHECK (condition IN ('above','below')),
     level REAL NOT NULL,
     note TEXT,
     status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','triggered','dismissed')),
     created_at TEXT NOT NULL DEFAULT (datetime('now')),
     triggered_at TEXT,
     triggered_price REAL
   );`,
  // 004 — generic UI state (workspace layout, etc). Purpose-built key/value
  // with no size cap, separate from the whitelisted+masked settings table.
  `CREATE TABLE ui_state (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL,
     updated_at TEXT NOT NULL DEFAULT (datetime('now'))
   );`,
];

export function getMeta(key: string): string | null {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

function setMeta(key: string, value: string): void {
  db.prepare(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, value);
}

export function runMigrations(): number {
  const applied = Number(getMeta('schema_version') ?? 0);
  for (let i = applied; i < migrations.length; i++) {
    db.exec('BEGIN');
    try {
      db.exec(migrations[i] as string);
      setMeta('schema_version', String(i + 1));
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
  return migrations.length;
}
