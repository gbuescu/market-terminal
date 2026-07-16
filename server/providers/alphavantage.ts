/**
 * Alpha Vantage adapter — activates when key.alphavantage is saved in
 * Settings. Free tier is tiny (25 requests/DAY), so statements cache for
 * 7 days and fundamentals for 24h (TTLs set in routes). Capabilities:
 * statements (income/balance/cashflow) and fundamentals (OVERVIEW).
 */
import type {
  Fundamentals,
  StatementPeriod,
  StatementPeriodicity,
  Statements,
  StatementType,
} from '../../shared/types.ts';
import { spendRequest } from '../budget.ts';
import { getSetting } from '../settings.ts';
import type { Provider } from './types.ts';

const BASE = 'https://www.alphavantage.co/query';

function key(): string | null {
  return getSetting('key.alphavantage');
}

async function getJson(params: string): Promise<Record<string, unknown>> {
  const k = key();
  if (!k) throw new Error('alpha vantage API key not configured');
  spendRequest('alphavantage');
  const res = await fetch(`${BASE}?${params}&apikey=${encodeURIComponent(k)}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`alpha vantage HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  // AV signals limit/errors inside a 200 body.
  const note = json.Note ?? json.Information ?? json['Error Message'];
  if (typeof note === 'string') throw new Error(`alpha vantage: ${note.slice(0, 140)}`);
  return json;
}

const toNum = (v: unknown): number | undefined => {
  if (typeof v !== 'string' || v === 'None' || v === '-') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const FUNCTION_BY_TYPE: Record<StatementType, string> = {
  income: 'INCOME_STATEMENT',
  balance: 'BALANCE_SHEET',
  cashflow: 'CASH_FLOW',
};

/** label -> AV report field; order defines display order */
const LINE_ITEMS: Record<StatementType, [string, string][]> = {
  income: [
    ['Revenue', 'totalRevenue'],
    ['Gross Profit', 'grossProfit'],
    ['Operating Income', 'operatingIncome'],
    ['Net Income', 'netIncome'],
  ],
  balance: [
    ['Total Assets', 'totalAssets'],
    ['Total Liabilities', 'totalLiabilities'],
    ['Shareholder Equity', 'totalShareholderEquity'],
    ['Cash & Equivalents', 'cashAndCashEquivalentsAtCarryingValue'],
    ['Long-Term Debt', 'longTermDebt'],
  ],
  cashflow: [
    ['Operating Cash Flow', 'operatingCashflow'],
    ['Capital Expenditure', 'capitalExpenditures'],
    ['Dividends Paid', 'dividendPayout'],
  ],
};

export const alphaVantageProvider: Provider = {
  id: 'alphavantage',
  name: 'Alpha Vantage',
  kind: 'live',
  delaySeconds: 86_400,
  freshness: 'eod',
  note: 'Free tier: 25 requests/day (budgeted 20) — responses cached aggressively. Requires API key (SET).',
  ready: () => key() !== null,
  capabilities: ['fundamentals', 'statements'],

  fundamentals: async (symbol: string): Promise<Fundamentals> => {
    const o = await getJson(`function=OVERVIEW&symbol=${encodeURIComponent(symbol)}`);
    if (!o.Symbol) throw new Error(`no overview for ${symbol}`);
    const divYield = toNum(o.DividendYield);
    const netMargin = toNum(o.ProfitMargin);
    const roe = toNum(o.ReturnOnEquityTTM);
    const opMargin = toNum(o.OperatingMarginTTM);
    return {
      symbol,
      name: typeof o.Name === 'string' ? o.Name : undefined,
      exchange: typeof o.Exchange === 'string' ? o.Exchange : undefined,
      sector: typeof o.Sector === 'string' ? o.Sector : undefined,
      industry: typeof o.Industry === 'string' ? o.Industry : undefined,
      currency: typeof o.Currency === 'string' ? o.Currency : undefined,
      marketCap: toNum(o.MarketCapitalization),
      peTTM: toNum(o.PERatio),
      epsTTM: toNum(o.EPS),
      dividendYield: divYield !== undefined ? divYield * 100 : undefined,
      netMarginTTM: netMargin !== undefined ? netMargin * 100 : undefined,
      operatingMarginTTM: opMargin !== undefined ? opMargin * 100 : undefined,
      roeTTM: roe !== undefined ? roe * 100 : undefined,
      beta: toNum(o.Beta),
      week52High: toNum(o['52WeekHigh']),
      week52Low: toNum(o['52WeekLow']),
    };
  },

  statements: async (
    symbol: string,
    type: StatementType,
    periodicity: StatementPeriodicity,
  ): Promise<Statements> => {
    const json = await getJson(
      `function=${FUNCTION_BY_TYPE[type]}&symbol=${encodeURIComponent(symbol)}`,
    );
    const reports = periodicity === 'annual' ? json.annualReports : json.quarterlyReports;
    if (!Array.isArray(reports) || reports.length === 0) {
      throw new Error(`no ${periodicity} ${type} statement for ${symbol}`);
    }
    const items = LINE_ITEMS[type];
    const periods: StatementPeriod[] = (reports as Record<string, unknown>[])
      .slice(0, periodicity === 'annual' ? 4 : 8)
      .map((rep) => {
        const values: Record<string, number | null> = {};
        for (const [label, field] of items) {
          const n = toNum(rep[field]);
          // Cash-outflow items arrive positive from AV; sign them for display.
          const outflow = label === 'Capital Expenditure' || label === 'Dividends Paid';
          values[label] = n === undefined ? null : outflow ? -n : n;
        }
        return {
          period: typeof rep.fiscalDateEnding === 'string' ? rep.fiscalDateEnding : 'unknown',
          values,
        };
      });
    const first = (reports as Record<string, unknown>[])[0];
    return {
      symbol,
      type,
      periodicity,
      currency: typeof first?.reportedCurrency === 'string' ? first.reportedCurrency : undefined,
      lineItems: items.map(([label]) => label),
      periods,
    };
  },
};
