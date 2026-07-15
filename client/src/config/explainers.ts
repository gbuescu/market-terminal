import type { ModuleId } from '../commands/registry';

/**
 * Student-mode explainers: one plain-English line per module, shown as a
 * strip under the module header when student mode is on (toggle in LEARN).
 */
export const EXPLAINERS: Record<ModuleId, string> = {
  monitor:
    'A market overview: major stock indices, FX and rates at a glance. Green/red = change vs previous close. Start here each session.',
  quote:
    "A security's current price and session stats. 'Prev close' anchors today's change; volume shows how actively it trades.",
  chart:
    'Price history. Longer ranges show the trend; 1D shows intraday. The % in the caption is the change over the visible range.',
  news: 'Headlines, market-wide or for one symbol. News moves prices — check it before reading too much into a move.',
  calendar:
    'Scheduled economic releases (CPI, jobs, central-bank decisions). ●●● = high market impact. Markets move on surprise vs forecast.',
  watchlist:
    'Your saved symbol lists with live quotes — organize what you follow (e.g. one list per sector or theme).',
  alerts:
    'Price-level notifications. When a symbol crosses your level the alert fires — it only notifies, it never trades.',
  notes:
    'Your research journal. Write down WHY you find something interesting — future-you will thank you.',
  settings:
    'Data plumbing: which sources feed each data type, API keys, and freshness labels. DEMO means synthetic practice data.',
  help: 'Every command and shortcut. Commands read SYMBOL then FUNCTION, like "AAPL GP" = chart Apple.',
  fx: 'Currency pairs. EUR/USD = 1.17 means one euro costs $1.17. The first currency is the base, the second the quote.',
  rates:
    'Government bond yields by maturity — the yield curve. Short yields track central-bank policy; long yields track growth/inflation expectations.',
  commodities:
    'Raw-material futures and crypto. =F suffixes are futures contracts. Energy and metals often move with the economic cycle.',
  fundamentals:
    "A company's vital signs: size (market cap), valuation (P/E), profitability (margins, ROE) and leverage (debt/equity). Compare within a sector.",
  statements:
    'The three financial statements. Income = profit over a period; balance sheet = what it owns/owes right now; cash flow = actual cash moved.',
  screener:
    'Filter the large-cap universe by criteria to build a shortlist. Low P/E + high yield tilts value; high 52W momentum tilts growth.',
  peers:
    'Side-by-side fundamentals for similar companies — "comps". A P/E only means something next to peers with similar growth.',
  learn:
    'Your learning hub: the guided tour teaches the terminal, the trainer drills command mnemonics, and this student-mode toggle controls these explainer strips.',
  glossary:
    'Finance concepts in plain English. Use the search box or category filters; "see it" links jump to where the concept lives in the terminal.',
};
