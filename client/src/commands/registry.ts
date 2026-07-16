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
  | 'help'
  | 'fx'
  | 'rates'
  | 'commodities'
  | 'fundamentals'
  | 'statements'
  | 'screener'
  | 'peers'
  | 'learn'
  | 'glossary'
  | 'insiders'
  | 'ratings'
  | 'earnings'
  | 'ipo'
  | 'dividends'
  | 'holdings'
  | 'short'
  | 'heatmap'
  | 'correlation';

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
    mnemonic: 'FX',
    aliases: ['CURRENCY', 'CURRENCIES'],
    name: 'FX Dashboard',
    description: 'Major currency pairs at a glance',
    moduleId: 'fx',
    takesSymbol: 'none',
    keywords: ['forex', 'currency', 'dollar', 'euro', 'yen'],
    examples: ['FX'],
  },
  {
    mnemonic: 'RATES',
    aliases: ['RATE', 'YIELDS', 'BONDS'],
    name: 'Rates Dashboard',
    description: 'Treasury yields across the curve',
    moduleId: 'rates',
    takesSymbol: 'none',
    keywords: ['treasury', 'yield', 'curve', 'bond', 'fixed income'],
    examples: ['RATES'],
  },
  {
    mnemonic: 'CMDTY',
    aliases: ['CMD', 'COMM', 'COMMODITIES'],
    name: 'Commodities Dashboard',
    description: 'Metals, energy and crypto futures/spot',
    moduleId: 'commodities',
    takesSymbol: 'none',
    keywords: ['gold', 'oil', 'metals', 'energy', 'futures', 'crypto'],
    examples: ['CMDTY'],
  },
  {
    mnemonic: 'FA',
    aliases: ['FUND', 'FUNDAMENTALS', 'PROFILE'],
    name: 'Fundamentals',
    description: 'Company profile and key financial metrics',
    moduleId: 'fundamentals',
    takesSymbol: 'required',
    keywords: ['ratios', 'pe', 'margins', 'valuation', 'company'],
    examples: ['AAPL FA'],
  },
  {
    mnemonic: 'FS',
    aliases: ['FIN', 'STATEMENTS', 'FINANCIALS'],
    name: 'Financial Statements',
    description: 'Income statement, balance sheet, cash flow',
    moduleId: 'statements',
    takesSymbol: 'required',
    keywords: ['income', 'balance', 'cashflow', 'revenue', 'earnings'],
    examples: ['AAPL FS'],
  },
  {
    mnemonic: 'SCR',
    aliases: ['SCREEN', 'SCREENER'],
    name: 'Equity Screener',
    description: 'Filter a large-cap universe by valuation metrics',
    moduleId: 'screener',
    takesSymbol: 'none',
    keywords: ['filter', 'find', 'stocks', 'valuation', 'universe'],
    examples: ['SCR'],
  },
  {
    mnemonic: 'RV',
    aliases: ['PEERS', 'COMP', 'COMPARE'],
    name: 'Peer Compare',
    description: 'Side-by-side relative value across symbols',
    moduleId: 'peers',
    takesSymbol: 'optional',
    keywords: ['relative', 'value', 'comparable', 'versus'],
    examples: ['RV', 'AAPL RV'],
  },
  {
    mnemonic: 'INS',
    aliases: ['INSIDER', 'INSIDERS'],
    name: 'Insider Transactions',
    description: 'Insider buys/sells from regulatory filings',
    moduleId: 'insiders',
    takesSymbol: 'required',
    keywords: ['insider', 'form 4', 'executive', 'buys', 'sells'],
    examples: ['AAPL INS'],
  },
  {
    mnemonic: 'AR',
    aliases: ['RATINGS', 'ANALYST', 'RECS'],
    name: 'Analyst Ratings',
    description: 'Recommendation trends — buy/hold/sell distribution',
    moduleId: 'ratings',
    takesSymbol: 'required',
    keywords: ['analyst', 'recommendation', 'consensus', 'upgrade', 'downgrade'],
    examples: ['AAPL AR'],
  },
  {
    mnemonic: 'ERN',
    aliases: ['EARN', 'EARNINGS'],
    name: 'Earnings',
    description: 'Earnings calendar; with a symbol: surprise history',
    moduleId: 'earnings',
    takesSymbol: 'optional',
    keywords: ['eps', 'surprise', 'beat', 'miss', 'report', 'quarter'],
    examples: ['ERN', 'AAPL ERN'],
  },
  {
    mnemonic: 'IPO',
    aliases: ['IPOS'],
    name: 'IPO Calendar',
    description: 'Upcoming and recent initial public offerings',
    moduleId: 'ipo',
    takesSymbol: 'none',
    keywords: ['listing', 'offering', 'debut', 'new issue'],
    examples: ['IPO'],
  },
  {
    mnemonic: 'DIV',
    aliases: ['DIVS', 'DIVIDEND', 'DIVIDENDS'],
    name: 'Dividend History',
    description: 'Per-share dividends as declared in SEC filings',
    moduleId: 'dividends',
    takesSymbol: 'required',
    keywords: ['dividend', 'payout', 'yield history', 'distribution'],
    examples: ['AAPL DIV'],
  },
  {
    mnemonic: 'HOLD',
    aliases: ['HOLDERS', '13F', 'OWNERSHIP'],
    name: 'Institutional Holders',
    description: '13F-style ownership (no free source — honest about it)',
    moduleId: 'holdings',
    takesSymbol: 'required',
    keywords: ['institutional', 'ownership', 'funds', 'whales'],
    examples: ['AAPL HOLD'],
  },
  {
    mnemonic: 'SI',
    aliases: ['SHORT', 'SHORTINT'],
    name: 'Short Interest',
    description: 'Short interest/float (no free source — honest about it)',
    moduleId: 'short',
    takesSymbol: 'required',
    keywords: ['short', 'float', 'squeeze', 'days to cover'],
    examples: ['AAPL SI'],
  },
  {
    mnemonic: 'HEAT',
    aliases: ['SECTORS', 'HEATMAP'],
    name: 'Sector Heatmap',
    description: 'Sector performance tiles via SPDR sector ETFs',
    moduleId: 'heatmap',
    takesSymbol: 'none',
    keywords: ['sector', 'rotation', 'performance', 'map'],
    examples: ['HEAT'],
  },
  {
    mnemonic: 'CORR',
    aliases: ['CORREL', 'CORRELATION'],
    name: 'Cross-Asset Correlation',
    description: 'Correlation matrix — equities, rates, gold, oil, USD, BTC',
    moduleId: 'correlation',
    takesSymbol: 'none',
    keywords: ['correlation', 'diversification', 'cross asset', 'matrix'],
    examples: ['CORR'],
  },
  {
    mnemonic: 'LEARN',
    aliases: ['TOUR', 'TUTORIAL', 'STUDENT'],
    name: 'Learning Center',
    description: 'Guided tour, mnemonic trainer, student mode toggle',
    moduleId: 'learn',
    takesSymbol: 'none',
    keywords: ['onboarding', 'training', 'practice', 'quiz', 'beginner'],
    examples: ['LEARN'],
  },
  {
    mnemonic: 'GLOS',
    aliases: ['GLOSSARY', 'DEFINE', 'DICT'],
    name: 'Finance Glossary',
    description: 'Concepts explained, cross-linked into the terminal',
    moduleId: 'glossary',
    takesSymbol: 'optional',
    keywords: ['definition', 'terms', 'concepts', 'what is', 'meaning'],
    examples: ['GLOS', 'BETA GLOS'],
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
