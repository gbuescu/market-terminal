import { type BoardSection, QuoteBoard } from '../components/QuoteBoard';
import type { Tab } from '../state/workspace';

const SECTIONS: BoardSection[] = [
  {
    label: 'ENERGY',
    rows: [
      { symbol: 'CL=F', name: 'WTI CRUDE' },
      { symbol: 'BZ=F', name: 'BRENT CRUDE' },
      { symbol: 'NG=F', name: 'NATURAL GAS' },
      { symbol: 'RB=F', name: 'GASOLINE' },
    ],
  },
  {
    label: 'METALS',
    rows: [
      { symbol: 'GC=F', name: 'GOLD' },
      { symbol: 'SI=F', name: 'SILVER' },
      { symbol: 'HG=F', name: 'COPPER' },
      { symbol: 'PL=F', name: 'PLATINUM' },
    ],
  },
  {
    label: 'AGRICULTURE',
    rows: [
      { symbol: 'ZC=F', name: 'CORN' },
      { symbol: 'ZW=F', name: 'WHEAT' },
      { symbol: 'ZS=F', name: 'SOYBEANS' },
    ],
  },
  {
    label: 'CRYPTO',
    rows: [
      { symbol: 'BTC-USD', name: 'BITCOIN' },
      { symbol: 'ETH-USD', name: 'ETHEREUM' },
      { symbol: 'SOL-USD', name: 'SOLANA' },
    ],
  },
];

export function Commodities({ tab }: { tab: Tab }) {
  return <QuoteBoard tab={tab} sections={SECTIONS} />;
}
