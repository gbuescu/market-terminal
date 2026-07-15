import { type BoardSection, QuoteBoard } from '../components/QuoteBoard';
import type { Tab } from '../state/workspace';

const SECTIONS: BoardSection[] = [
  {
    label: 'MAJORS (vs USD)',
    rows: [
      { symbol: 'EURUSD=X', name: 'EUR/USD' },
      { symbol: 'GBPUSD=X', name: 'GBP/USD' },
      { symbol: 'JPY=X', name: 'USD/JPY' },
      { symbol: 'CHF=X', name: 'USD/CHF' },
    ],
  },
  {
    label: 'DOLLAR BLOC',
    rows: [
      { symbol: 'AUDUSD=X', name: 'AUD/USD' },
      { symbol: 'NZDUSD=X', name: 'NZD/USD' },
      { symbol: 'CAD=X', name: 'USD/CAD' },
    ],
  },
  {
    label: 'CROSSES',
    rows: [
      { symbol: 'EURGBP=X', name: 'EUR/GBP' },
      { symbol: 'EURJPY=X', name: 'EUR/JPY' },
      { symbol: 'GBPJPY=X', name: 'GBP/JPY' },
    ],
  },
  {
    label: 'EMERGING',
    rows: [
      { symbol: 'CNY=X', name: 'USD/CNY' },
      { symbol: 'INR=X', name: 'USD/INR' },
      { symbol: 'MXN=X', name: 'USD/MXN' },
    ],
  },
];

export function Fx({ tab }: { tab: Tab }) {
  return <QuoteBoard tab={tab} sections={SECTIONS} />;
}
