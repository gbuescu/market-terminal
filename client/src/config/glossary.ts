/**
 * Finance glossary for the GLOS module. Curated for a finance student using
 * this terminal: crisp definitions, cross-links to terminal functions where
 * a concept is visible in action.
 */
export interface GlossaryTerm {
  term: string;
  category: string;
  definition: string;
  /** Terminal mnemonic(s) where the concept shows up */
  seeInApp?: string;
}

export const GLOSSARY_CATEGORIES = [
  'MARKETS',
  'VALUATION',
  'STATEMENTS',
  'FIXED INCOME',
  'FX & MACRO',
  'RISK & DERIVATIVES',
] as const;

export const GLOSSARY: GlossaryTerm[] = [
  // ---------- MARKETS ----------
  {
    term: 'Ask / Offer',
    category: 'MARKETS',
    definition: 'The lowest price a seller is currently willing to accept for a security.',
  },
  {
    term: 'Bid',
    category: 'MARKETS',
    definition: 'The highest price a buyer is currently willing to pay for a security.',
  },
  {
    term: 'Bid-Ask Spread',
    category: 'MARKETS',
    definition:
      'The gap between bid and ask. Tighter spreads mean more liquidity and lower trading cost.',
  },
  {
    term: 'Bull / Bear Market',
    category: 'MARKETS',
    definition:
      'Sustained rising (bull) or falling (bear) market. A bear market is conventionally a 20%+ decline from a peak.',
  },
  {
    term: 'ETF',
    category: 'MARKETS',
    definition:
      'Exchange-Traded Fund — a basket of securities trading like a single stock (e.g. SPY tracks the S&P 500).',
    seeInApp: 'SPY Q',
  },
  {
    term: 'Index',
    category: 'MARKETS',
    definition:
      'A rules-based basket measuring a market segment, e.g. S&P 500 (US large caps), FTSE 100 (UK), Nikkei 225 (Japan).',
    seeInApp: 'MON',
  },
  {
    term: 'Liquidity',
    category: 'MARKETS',
    definition:
      'How easily an asset trades without moving its price. High volume and tight spreads signal liquidity.',
  },
  {
    term: 'Market Capitalization',
    category: 'MARKETS',
    definition:
      'Share price × shares outstanding — the market value of a company. Large cap ≳ $10B, mid $2–10B, small < $2B.',
    seeInApp: 'AAPL FA',
  },
  {
    term: 'Market Order vs Limit Order',
    category: 'MARKETS',
    definition:
      'A market order executes immediately at the best available price; a limit order only at a chosen price or better. (Definitions only — this terminal never places orders.)',
  },
  {
    term: 'Previous Close',
    category: 'MARKETS',
    definition: "The prior session's final price — the reference for today's change and % change.",
    seeInApp: 'AAPL Q',
  },
  {
    term: 'Volume',
    category: 'MARKETS',
    definition:
      'Shares (or contracts) traded in a period. Price moves on high volume carry more conviction.',
    seeInApp: 'AAPL Q',
  },
  {
    term: '52-Week Range',
    category: 'MARKETS',
    definition:
      'Highest and lowest price over the trailing year — a quick sense of where price sits in its recent history.',
    seeInApp: 'AAPL FA',
  },

  // ---------- VALUATION ----------
  {
    term: 'Beta',
    category: 'VALUATION',
    definition:
      'Sensitivity to market moves. Beta 1 moves with the market; >1 amplifies it; <1 dampens it; negative moves opposite.',
    seeInApp: 'AAPL FA',
  },
  {
    term: 'Dividend Yield',
    category: 'VALUATION',
    definition: 'Annual dividends per share ÷ price, in %. Income return before any price change.',
    seeInApp: 'SCR',
  },
  {
    term: 'EPS (Earnings Per Share)',
    category: 'VALUATION',
    definition:
      'Net income ÷ shares outstanding. "TTM" means trailing twelve months of actual results.',
    seeInApp: 'AAPL FA',
  },
  {
    term: 'Growth vs Value',
    category: 'VALUATION',
    definition:
      'Growth stocks are priced for high future expansion (high P/E, low yield); value stocks trade cheap relative to current fundamentals.',
    seeInApp: 'SCR',
  },
  {
    term: 'P/E Ratio',
    category: 'VALUATION',
    definition:
      'Price ÷ earnings per share — how many dollars you pay per dollar of annual profit. Compare within a sector, not across.',
    seeInApp: 'AAPL RV',
  },
  {
    term: 'Peer Comparison / Relative Value',
    category: 'VALUATION',
    definition:
      'Valuing a company against similar businesses (comps) rather than in isolation — the core of multiples-based analysis.',
    seeInApp: 'AAPL RV',
  },
  {
    term: 'ROE (Return on Equity)',
    category: 'VALUATION',
    definition:
      "Net income ÷ shareholder equity — how efficiently a company turns owners' capital into profit.",
    seeInApp: 'AAPL FA',
  },
  {
    term: 'Screening',
    category: 'VALUATION',
    definition:
      'Filtering a universe of stocks by quantitative criteria (cap, P/E, yield…) to build a research shortlist.',
    seeInApp: 'SCR',
  },

  // ---------- STATEMENTS ----------
  {
    term: 'Balance Sheet',
    category: 'STATEMENTS',
    definition:
      'Snapshot of what a company owns (assets) and owes (liabilities); the difference is shareholder equity. Assets = Liabilities + Equity.',
    seeInApp: 'AAPL FS',
  },
  {
    term: 'Capital Expenditure (CapEx)',
    category: 'STATEMENTS',
    definition:
      'Cash spent on long-lived assets (plants, equipment, data centers). Found in the cash flow statement; heavy CapEx suits growth or asset-intensive businesses.',
    seeInApp: 'AAPL FS',
  },
  {
    term: 'Cash Flow Statement',
    category: 'STATEMENTS',
    definition:
      'Tracks actual cash in/out across operating, investing and financing activities — harder to massage than accounting earnings.',
    seeInApp: 'AAPL FS',
  },
  {
    term: 'Free Cash Flow (FCF)',
    category: 'STATEMENTS',
    definition:
      'Operating cash flow minus CapEx — cash genuinely available for dividends, buybacks, debt paydown or acquisitions.',
    seeInApp: 'AAPL FS',
  },
  {
    term: 'Gross / Operating / Net Margin',
    category: 'STATEMENTS',
    definition:
      'Profit as % of revenue at successive stages: after production costs (gross), after operating costs (operating), after everything incl. tax and interest (net).',
    seeInApp: 'AAPL FA',
  },
  {
    term: 'Income Statement',
    category: 'STATEMENTS',
    definition:
      'Revenue down to net income over a period — the "P&L". Watch the trend, not a single year.',
    seeInApp: 'AAPL FS',
  },
  {
    term: 'Revenue / Top Line',
    category: 'STATEMENTS',
    definition:
      'Total sales before any costs. "Top line" because it heads the income statement; net income is the "bottom line".',
    seeInApp: 'AAPL FS',
  },
  {
    term: 'Debt-to-Equity',
    category: 'STATEMENTS',
    definition:
      'Total debt ÷ shareholder equity — leverage. More debt amplifies both returns and risk.',
    seeInApp: 'AAPL FA',
  },

  // ---------- FIXED INCOME ----------
  {
    term: 'Basis Point (bp)',
    category: 'FIXED INCOME',
    definition:
      'One hundredth of a percentage point. 25 bp = 0.25%. The native unit of rates talk.',
  },
  {
    term: 'Coupon',
    category: 'FIXED INCOME',
    definition:
      'The fixed interest a bond pays, as % of face value. A 4% coupon on $1,000 face pays $40/year.',
  },
  {
    term: 'Credit Spread',
    category: 'FIXED INCOME',
    definition:
      'Extra yield over Treasuries that corporate borrowers pay for default risk. Widening spreads signal stress.',
    seeInApp: 'RATES',
  },
  {
    term: 'Duration',
    category: 'FIXED INCOME',
    definition:
      'Price sensitivity to rate moves: duration 7 ≈ 7% price drop per 1% rate rise. Longer maturity → higher duration.',
    seeInApp: 'RATES',
  },
  {
    term: 'Yield',
    category: 'FIXED INCOME',
    definition: "A bond's annualized return at the current price. Price and yield move inversely.",
    seeInApp: 'RATES',
  },
  {
    term: 'Yield Curve',
    category: 'FIXED INCOME',
    definition:
      'Yields across maturities (3M → 30Y). Normally upward-sloping; inversion (short > long) has historically preceded recessions.',
    seeInApp: 'RATES',
  },
  {
    term: 'High Yield / Investment Grade',
    category: 'FIXED INCOME',
    definition:
      'Credit-rating split: investment grade (BBB-/Baa3 and above) vs high yield a.k.a. junk (below), which pays more for more default risk.',
    seeInApp: 'RATES',
  },

  // ---------- FX & MACRO ----------
  {
    term: 'Base / Quote Currency',
    category: 'FX & MACRO',
    definition: 'In EUR/USD = 1.17, EUR is the base, USD the quote: one euro costs 1.17 dollars.',
    seeInApp: 'FX',
  },
  {
    term: 'CPI (Consumer Price Index)',
    category: 'FX & MACRO',
    definition:
      'The main inflation gauge — price change of a consumer basket, usually quoted year-over-year.',
    seeInApp: 'ECO',
  },
  {
    term: 'Central Bank Policy Rate',
    category: 'FX & MACRO',
    definition:
      'The short-term rate set by central banks (Fed, ECB, BoJ…) to steer inflation and growth; anchors all other rates.',
    seeInApp: 'ECO',
  },
  {
    term: 'GDP',
    category: 'FX & MACRO',
    definition:
      "Gross Domestic Product — total value of an economy's output; its growth rate defines expansion vs recession.",
    seeInApp: 'ECO',
  },
  {
    term: 'Hawkish / Dovish',
    category: 'FX & MACRO',
    definition:
      'Policy leanings: hawkish favors higher rates to fight inflation; dovish favors lower rates to support growth.',
  },
  {
    term: 'Nonfarm Payrolls (NFP)',
    category: 'FX & MACRO',
    definition:
      'Monthly US jobs report — one of the most market-moving data releases, first Friday of the month.',
    seeInApp: 'ECO',
  },
  {
    term: 'Safe Haven',
    category: 'FX & MACRO',
    definition: 'Assets that tend to gain in stress: USD, JPY, CHF, gold, Treasuries.',
    seeInApp: 'CMDTY',
  },

  // ---------- RISK & DERIVATIVES ----------
  {
    term: 'Diversification',
    category: 'RISK & DERIVATIVES',
    definition:
      'Spreading exposure across imperfectly-correlated assets so no single position dominates outcomes — the one "free lunch" in finance.',
    seeInApp: 'W',
  },
  {
    term: 'Drawdown',
    category: 'RISK & DERIVATIVES',
    definition:
      'Peak-to-trough decline of a position or portfolio — the pain measure investors actually live through.',
  },
  {
    term: 'Futures',
    category: 'RISK & DERIVATIVES',
    definition:
      'Standardized contracts to buy/sell an asset at a set price on a future date. Commodity tickers like GC=F (gold) are futures.',
    seeInApp: 'CMDTY',
  },
  {
    term: 'Hedge',
    category: 'RISK & DERIVATIVES',
    definition:
      'A position taken to offset risk in another (e.g. holding gold against equity risk), accepting lower upside for protection.',
  },
  {
    term: 'Option (Call / Put)',
    category: 'RISK & DERIVATIVES',
    definition:
      'The right, not obligation, to buy (call) or sell (put) at a strike price by expiry. Buyers risk the premium; sellers take open-ended risk.',
  },
  {
    term: 'Volatility',
    category: 'RISK & DERIVATIVES',
    definition:
      'How widely returns swing. Realized = measured from history; implied = priced into options (e.g. VIX for the S&P 500).',
    seeInApp: '^VIX GP',
  },
];
