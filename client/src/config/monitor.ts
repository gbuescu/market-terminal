/**
 * Markets-monitor layout: region panels and their symbols (Yahoo-style ids;
 * the demo provider understands the same ids). Display names are local so
 * the monitor renders sensibly even when a provider omits names.
 */
export interface MonitorRow {
  symbol: string;
  name: string;
}

export const MONITOR_REGIONS: { label: string; rows: MonitorRow[] }[] = [
  {
    label: 'AMERICAS',
    rows: [
      { symbol: '^GSPC', name: 'S&P 500' },
      { symbol: '^IXIC', name: 'NASDAQ' },
      { symbol: '^DJI', name: 'DOW' },
    ],
  },
  {
    label: 'EUROPE',
    rows: [
      { symbol: '^FTSE', name: 'FTSE 100' },
      { symbol: '^GDAXI', name: 'DAX' },
      { symbol: '^FCHI', name: 'CAC 40' },
    ],
  },
  {
    label: 'ASIA-PACIFIC',
    rows: [
      { symbol: '^N225', name: 'NIKKEI 225' },
      { symbol: '^HSI', name: 'HANG SENG' },
      { symbol: '^AXJO', name: 'ASX 200' },
    ],
  },
  {
    label: 'FX',
    rows: [
      { symbol: 'EURUSD=X', name: 'EUR/USD' },
      { symbol: 'GBPUSD=X', name: 'GBP/USD' },
      { symbol: 'JPY=X', name: 'USD/JPY' },
    ],
  },
  {
    label: 'RATES',
    rows: [
      { symbol: '^FVX', name: 'US 5Y YIELD' },
      { symbol: '^TNX', name: 'US 10Y YIELD' },
      { symbol: '^TYX', name: 'US 30Y YIELD' },
    ],
  },
  {
    label: 'COMMODITIES & CRYPTO',
    rows: [
      { symbol: 'GC=F', name: 'GOLD' },
      { symbol: 'CL=F', name: 'WTI CRUDE' },
      { symbol: 'BTC-USD', name: 'BITCOIN' },
    ],
  },
];

export const ALL_MONITOR_SYMBOLS = MONITOR_REGIONS.flatMap((r) => r.rows.map((x) => x.symbol));
