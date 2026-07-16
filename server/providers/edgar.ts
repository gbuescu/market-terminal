/**
 * SEC EDGAR adapter — official US filings data, free, keyless, unlimited
 * (fair-access: <=10 req/sec; we budget 240/min and identify ourselves via
 * User-Agent as SEC requires). Capabilities: statements (annual 10-K and
 * quarterly 10-Q from XBRL companyfacts) and dividends (per-share declared).
 * US filers only — non-US symbols fall through via Unsupported.
 */
import type {
  DividendRow,
  StatementPeriod,
  StatementPeriodicity,
  Statements,
  StatementType,
} from '../../shared/types.ts';
import { spendRequest } from '../budget.ts';
import { getOrFetch } from '../cache.ts';
import { type Provider, Unsupported } from './types.ts';

// SEC asks for a descriptive User-Agent with contact info.
const HEADERS = {
  'User-Agent': 'market-terminal (local research app; contact-not-configured)',
  Accept: 'application/json',
};

async function getJson(url: string): Promise<unknown> {
  spendRequest('edgar');
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`EDGAR HTTP ${res.status}`);
  return res.json();
}

// ---------- ticker -> CIK ----------

interface TickerRow {
  cik_str: number;
  ticker: string;
  title: string;
}

async function cikFor(symbol: string): Promise<string> {
  // company_tickers.json is ~1MB and changes rarely; cache for a day.
  const hit = await getOrFetch('edgar:cikmap', 86_400_000, async () => {
    const json = (await getJson('https://www.sec.gov/files/company_tickers.json')) as Record<
      string,
      TickerRow
    >;
    const map: Record<string, number> = {};
    for (const row of Object.values(json)) map[row.ticker.toUpperCase()] = row.cik_str;
    return map;
  });
  const cik = hit.data[symbol.toUpperCase()];
  if (!cik) throw new Unsupported(`${symbol} is not a US SEC filer`);
  return String(cik).padStart(10, '0');
}

// ---------- companyfacts ----------

interface FactPoint {
  end: string;
  val: number;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
  frame?: string;
  start?: string;
}

interface CompanyFacts {
  entityName?: string;
  facts?: {
    'us-gaap'?: Record<string, { units?: Record<string, FactPoint[]> }>;
  };
}

async function companyFacts(symbol: string): Promise<CompanyFacts> {
  const cik = await cikFor(symbol);
  const hit = await getOrFetch(
    `edgar:facts:${cik}`,
    21_600_000, // 6h — filings don't move intraday
    () =>
      getJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`) as Promise<CompanyFacts>,
  );
  return hit.data;
}

/**
 * All points for each candidate tag, earliest-priority first. Companies
 * switch tags over the years (e.g. Apple's Revenues ->
 * RevenueFromContractWithCustomer...), so a single tag rarely covers every
 * period — callers merge across tags per end date.
 */
function factSeriesAll(facts: CompanyFacts, tags: string[]): FactPoint[][] {
  const gaap = facts.facts?.['us-gaap'];
  if (!gaap) return [];
  const out: FactPoint[][] = [];
  for (const tag of tags) {
    const units = gaap[tag]?.units;
    const pts = units?.USD ?? units?.['USD/shares'];
    if (pts && pts.length > 0) out.push(pts);
  }
  return out;
}

/** Line item -> candidate XBRL tags, in preference order. */
const STATEMENT_TAGS: Record<StatementType, [string, string[]][]> = {
  income: [
    [
      'Revenue',
      [
        'Revenues',
        'RevenueFromContractWithCustomerExcludingAssessedTax',
        'SalesRevenueNet',
        'RevenueFromContractWithCustomerIncludingAssessedTax',
      ],
    ],
    ['Gross Profit', ['GrossProfit']],
    ['Operating Income', ['OperatingIncomeLoss']],
    ['Net Income', ['NetIncomeLoss', 'ProfitLoss']],
  ],
  balance: [
    ['Total Assets', ['Assets']],
    ['Total Liabilities', ['Liabilities']],
    [
      'Shareholder Equity',
      [
        'StockholdersEquity',
        'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
      ],
    ],
    [
      'Cash & Equivalents',
      [
        'CashAndCashEquivalentsAtCarryingValue',
        'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents',
      ],
    ],
    ['Long-Term Debt', ['LongTermDebtNoncurrent', 'LongTermDebt']],
  ],
  cashflow: [
    ['Operating Cash Flow', ['NetCashProvidedByUsedInOperatingActivities']],
    ['Capital Expenditure', ['PaymentsToAcquirePropertyPlantAndEquipment']],
    ['Dividends Paid', ['PaymentsOfDividends', 'PaymentsOfDividendsCommonStock']],
  ],
};

/** Instantaneous (point-in-time) items vs duration (flow) items. */
const BALANCE_LIKE = new Set(['balance']);

/**
 * Pick the reporting points for a periodicity. Annual = 10-K FY rows;
 * quarterly = 10-Q rows (duration facts on 10-Qs may be YTD for some
 * filers/tags; we keep quarters whose duration is ~1 quarter when start/end
 * are present). Dedupe by end date keeping the latest filing.
 */
function pickPoints(
  pts: FactPoint[],
  periodicity: StatementPeriodicity,
  instantaneous: boolean,
): Map<string, number> {
  const wanted = pts.filter((p) => {
    if (periodicity === 'annual') return p.form === '10-K' && (p.fp === 'FY' || instantaneous);
    if (p.form !== '10-Q') return false;
    if (instantaneous || !p.start) return true;
    const days = (new Date(p.end).getTime() - new Date(p.start).getTime()) / 86_400_000;
    return days > 70 && days < 110; // single quarter, not YTD
  });
  const byEnd = new Map<string, FactPoint>();
  for (const p of wanted) {
    const prev = byEnd.get(p.end);
    if (!prev || (p.filed ?? '') >= (prev.filed ?? '')) byEnd.set(p.end, p);
  }
  const out = new Map<string, number>();
  for (const [end, p] of byEnd) out.set(end, p.val);
  return out;
}

async function edgarStatements(
  symbol: string,
  type: StatementType,
  periodicity: StatementPeriodicity,
): Promise<Statements> {
  const facts = await companyFacts(symbol);
  const items = STATEMENT_TAGS[type];
  const instantaneous = BALANCE_LIKE.has(type);
  const perItem = new Map<string, Map<string, number>>();
  const allEnds = new Set<string>();
  for (const [label, tags] of items) {
    // Merge candidate tags: preferred tag wins per end date, later candidates
    // fill the periods it lacks (tag transitions across filing years).
    const merged = new Map<string, number>();
    for (const pts of factSeriesAll(facts, tags)) {
      const picked = pickPoints(pts, periodicity, instantaneous);
      for (const [end, val] of picked) {
        if (!merged.has(end)) merged.set(end, val);
      }
    }
    perItem.set(label, merged);
    for (const end of merged.keys()) allEnds.add(end);
  }
  if (allEnds.size === 0) throw new Error(`no ${periodicity} ${type} facts for ${symbol} on EDGAR`);
  const keep = periodicity === 'annual' ? 5 : 8;
  const ends = [...allEnds].sort().slice(-keep);
  const periods: StatementPeriod[] = ends.map((end) => {
    const values: Record<string, number | null> = {};
    for (const [label] of items) {
      const v = perItem.get(label)?.get(end);
      // Sign outflows for display consistency with other providers.
      const outflow = label === 'Capital Expenditure' || label === 'Dividends Paid';
      values[label] = v === undefined ? null : outflow ? -Math.abs(v) : v;
    }
    return { period: end, values };
  });
  return {
    symbol,
    type,
    periodicity,
    currency: 'USD',
    lineItems: items.map(([label]) => label),
    periods,
  };
}

async function edgarDividends(symbol: string): Promise<DividendRow[]> {
  const facts = await companyFacts(symbol);
  const pts = factSeriesAll(facts, [
    'CommonStockDividendsPerShareDeclared',
    'CommonStockDividendsPerShareCashPaid',
  ]).flat();
  if (pts.length === 0) throw new Error(`no dividend facts for ${symbol} on EDGAR`);
  // Quarterly declarations from 10-Q/10-K; keep single-quarter durations.
  const byEnd = new Map<string, FactPoint>();
  for (const p of pts) {
    if (p.start) {
      const days = (new Date(p.end).getTime() - new Date(p.start).getTime()) / 86_400_000;
      if (days > 110) continue; // skip YTD/annual aggregates
    }
    const prev = byEnd.get(p.end);
    if (!prev || (p.filed ?? '') >= (prev.filed ?? '')) byEnd.set(p.end, p);
  }
  return [...byEnd.values()]
    .sort((a, b) => (a.end < b.end ? 1 : -1))
    .slice(0, 24)
    .map((p) => ({ date: p.end, amount: p.val, currency: 'USD' }));
}

export const edgarProvider: Provider = {
  id: 'edgar',
  name: 'SEC EDGAR',
  kind: 'live',
  delaySeconds: 0,
  freshness: 'official',
  note: 'Official SEC XBRL filings (US filers). No key. Data as-filed; published on reporting cadence, not intraday.',
  ready: () => true,
  capabilities: ['statements', 'dividends'],
  statements: edgarStatements,
  dividends: edgarDividends,
};
