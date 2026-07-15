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
  'key.finnhub',
  'key.alphavantage',
  'key.fred',
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
  return row?.value ?? null;
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
