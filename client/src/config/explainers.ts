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
  insiders:
    'Executives and directors must report their own-company trades. Clusters of open-market BUYs are the interesting signal; sales are often routine.',
  ratings:
    'What Wall Street analysts recommend, month by month. Watch the trend of the distribution, not any single label — analysts skew bullish.',
  earnings:
    'Companies report quarterly. The market reacts to the SURPRISE vs estimates, not the absolute number. bmo = before open, amc = after close.',
  ipo: 'Companies going public. Price range and share count are set late in the process; expect volatility on debut day.',
  dividends:
    'Cash returned to shareholders per share, as declared in SEC filings. Steady growth signals confidence; a cut is a loud warning.',
  holdings:
    'Large funds must disclose US holdings quarterly (13F filings). No free aggregated source exists — this module is honest about that.',
  short:
    'Shares sold short as % of float. High short interest = crowded bearish bet (and squeeze fuel). No free source — honest about that too.',
  heatmap:
    "Each tile is a sector of the S&P 500 (via SPDR ETFs), colored by today's move. One glance shows what kind of day the market is having.",
  correlation:
    'How assets move together (+1) or opposite (−1), from 6 months of daily returns. Low/negative correlation is what makes diversification work.',
};
