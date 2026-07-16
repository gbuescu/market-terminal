/**
 * Settings store (SQLite `settings` table). Only whitelisted keys are
 * accepted; secret-ish values are masked when read back for display.
 */
import { db } from './db.ts';

export const SETTING_KEYS = [
  'provider.search',
  'provider.quotes',
  'provider.series',
  'provider.news',
  'provider.calendar',
  'provider.fundamentals',
  'provider.statements',
  'provider.insiders',
  'provider.ratings',
  'provider.earnings',
  'provider.earningscal',
  'provider.ipo',
  'provider.dividends',
  'provider.holdings',
  'provider.short',
  'key.finnhub',
  'key.alphavantage',
  'key.fred',
  'key.marketaux',
  'learn.onboarded',
  'learn.studentmode',
  'learn.progress',
  'learn.streak',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export function isSettingKey(key: string): key is SettingKey {
  return (SETTING_KEYS as readonly string[]).includes(key);
}

export function getSetting(key: SettingKey): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  if (row?.value) return row.value;
  // API keys may also come from env (loaded via --env-file-if-exists=.env);
  // the settings table wins when both exist. key.finnhub -> MKT_KEY_FINNHUB.
  if (key.startsWith('key.')) {
    const env = process.env[`MKT_KEY_${key.slice(4).toUpperCase()}`];
    if (env?.trim()) return env.trim();
  }
  return null;
}

export function setSetting(key: SettingKey, value: string): void {
  if (value === '') {
    db.prepare('DELETE FROM settings WHERE key = ?').run(key);
    return;
  }
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, value);
}

/** All settings with secrets masked to their last 4 characters. */
export function maskedSettings(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM settings').all() as {
    key: string;
    value: string;
  }[];
  const out: Record<string, string> = {};
  for (const { key, value } of rows) {
    out[key] = key.startsWith('key.') ? `••••${value.slice(-4)}` : value;
  }
  return out;
}
