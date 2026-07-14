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
