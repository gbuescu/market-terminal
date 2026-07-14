/**
 * Mnemonic registry — the single source of truth for terminal commands.
 * Adding a command = adding one entry here. Never scatter command strings
 * through the UI (CLAUDE.md command-parser rule).
 */

export type ModuleId =
  | 'monitor'
  | 'quote'
  | 'chart'
  | 'news'
  | 'calendar'
  | 'watchlist'
  | 'alerts'
  | 'notes'
  | 'settings'
  | 'help';

export interface CommandDef {
  /** Primary mnemonic, uppercase, e.g. 'GP' */
  mnemonic: string;
  aliases: readonly string[];
  name: string;
  description: string;
  moduleId: ModuleId;
  takesSymbol: 'required' | 'optional' | 'none';
  /** Extra terms for fuzzy plain-English matching */
  keywords: readonly string[];
  examples: readonly string[];
}

export const COMMANDS: readonly CommandDef[] = [
  {
    mnemonic: 'MON',
    aliases: ['MONITOR', 'MARKETS', 'GLOBAL'],
    name: 'Markets Monitor',
    description: 'Global markets overview — indices, futures, FX, rates',
    moduleId: 'monitor',
    takesSymbol: 'none',
    keywords: ['overview', 'indices', 'dashboard', 'world', 'market'],
    examples: ['MON'],
  },
  {
    mnemonic: 'Q',
    aliases: ['QUOTE', 'DES'],
    name: 'Quote',
    description: 'Security quote page — price, stats, profile',
    moduleId: 'quote',
    takesSymbol: 'required',
    keywords: ['price', 'security', 'stock', 'ticker', 'describe'],
    examples: ['AAPL Q', 'MSFT Q'],
  },
  {
    mnemonic: 'GP',
    aliases: ['CHART', 'G'],
    name: 'Chart',
    description: 'Price chart — intervals, ranges, overlays',
    moduleId: 'chart',
    takesSymbol: 'required',
    keywords: ['graph', 'candles', 'price', 'history', 'technical'],
    examples: ['AAPL GP', 'EURUSD GP'],
  },
  {
    mnemonic: 'N',
    aliases: ['NEWS'],
    name: 'News',
    description: 'News feed — market-wide or filtered to a symbol',
    moduleId: 'news',
    takesSymbol: 'optional',
    keywords: ['headlines', 'articles', 'press', 'feed'],
    examples: ['N', 'TSLA N'],
  },
  {
    mnemonic: 'ECO',
    aliases: ['CAL', 'CALENDAR'],
    name: 'Economic Calendar',
    description: 'Macro releases, central-bank meetings, earnings dates',
    moduleId: 'calendar',
    takesSymbol: 'none',
    keywords: ['economics', 'macro', 'cpi', 'fed', 'events', 'earnings'],
    examples: ['ECO'],
  },
  {
    mnemonic: 'W',
    aliases: ['WL', 'WATCH', 'WATCHLIST'],
    name: 'Watchlist',
    description: 'Your watchlists — grouped symbols with live quotes',
    moduleId: 'watchlist',
    takesSymbol: 'none',
    keywords: ['list', 'portfolio', 'follow', 'track'],
    examples: ['W'],
  },
  {
    mnemonic: 'ALRT',
    aliases: ['ALERT', 'ALERTS'],
    name: 'Alerts Center',
    description: 'Price/level alerts — notify only, never act',
    moduleId: 'alerts',
    takesSymbol: 'optional',
    keywords: ['notify', 'trigger', 'level', 'threshold'],
    examples: ['ALRT', 'AAPL ALRT'],
  },
  {
    mnemonic: 'NOTE',
    aliases: ['NOTES', 'NT'],
    name: 'Notes',
    description: 'Research notes and journal',
    moduleId: 'notes',
    takesSymbol: 'optional',
    keywords: ['journal', 'research', 'memo', 'write'],
    examples: ['NOTE', 'NVDA NOTE'],
  },
  {
    mnemonic: 'SET',
    aliases: ['SETTINGS', 'CONFIG', 'PREF'],
    name: 'Settings',
    description: 'API keys, data providers, appearance, storage',
    moduleId: 'settings',
    takesSymbol: 'none',
    keywords: ['keys', 'provider', 'configuration', 'options'],
    examples: ['SET'],
  },
  {
    mnemonic: 'HELP',
    aliases: ['?', 'H', 'CHEAT'],
    name: 'Help & Cheat Sheet',
    description: 'All commands, shortcuts, and how to use the terminal',
    moduleId: 'help',
    takesSymbol: 'none',
    keywords: ['commands', 'shortcuts', 'guide', 'learn', 'tutorial'],
    examples: ['HELP'],
  },
];

const byToken = new Map<string, CommandDef>();
for (const def of COMMANDS) {
  byToken.set(def.mnemonic, def);
  for (const a of def.aliases) byToken.set(a, def);
}

/** Exact mnemonic/alias lookup (token must already be uppercase). */
export function findCommand(token: string): CommandDef | undefined {
  return byToken.get(token);
}

export const MODULE_COMMAND: Record<ModuleId, CommandDef> = Object.fromEntries(
  COMMANDS.map((c) => [c.moduleId, c]),
) as Record<ModuleId, CommandDef>;
