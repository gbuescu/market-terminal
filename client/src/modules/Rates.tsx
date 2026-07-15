import { type BoardSection, QuoteBoard } from '../components/QuoteBoard';
import type { Tab } from '../state/workspace';

const SECTIONS: BoardSection[] = [
  {
    label: 'US TREASURY CURVE',
    rows: [
      { symbol: '^IRX', name: '13-WEEK BILL' },
      { symbol: '^FVX', name: '5-YEAR YIELD' },
      { symbol: '^TNX', name: '10-YEAR YIELD' },
      { symbol: '^TYX', name: '30-YEAR YIELD' },
    ],
  },
  {
    label: 'RATE-SENSITIVE PROXIES',
    rows: [
      { symbol: 'TLT', name: '20Y+ TREASURY ETF' },
      { symbol: 'IEF', name: '7-10Y TREASURY ETF' },
      { symbol: 'SHY', name: '1-3Y TREASURY ETF' },
      { symbol: 'LQD', name: 'IG CORPORATE ETF' },
      { symbol: 'HYG', name: 'HIGH YIELD ETF' },
    ],
  },
];

export function Rates({ tab }: { tab: Tab }) {
  return <QuoteBoard tab={tab} sections={SECTIONS} />;
}
