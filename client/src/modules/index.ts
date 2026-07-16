import type { ComponentType } from 'react';
import type { ModuleId } from '../commands/registry';
import type { Tab } from '../state/workspace';
import { Alerts } from './Alerts';
import { Calendar } from './Calendar';
import { Chart } from './Chart';
import { Commodities } from './Commodities';
import { Correlation } from './Correlation';
import { Dividends } from './Dividends';
import { Earnings } from './Earnings';
import { Fundamentals } from './Fundamentals';
import { Fx } from './Fx';
import { Glossary } from './Glossary';
import { Heatmap } from './Heatmap';
import { Help } from './Help';
import { Holdings } from './Holdings';
import { Insiders } from './Insiders';
import { Ipo } from './Ipo';
import { Learn } from './Learn';
import { Monitor } from './Monitor';
import { News } from './News';
import { Notes } from './Notes';
import { Peers } from './Peers';
import { Quote } from './Quote';
import { Rates } from './Rates';
import { Ratings } from './Ratings';
import { Screener } from './Screener';
import { Settings } from './Settings';
import { ShortInt } from './ShortInt';
import { Statements } from './Statements';
import { Watchlist } from './Watchlist';

export const MODULES: Record<ModuleId, ComponentType<{ tab: Tab }>> = {
  monitor: Monitor,
  quote: Quote,
  chart: Chart,
  news: News,
  calendar: Calendar,
  watchlist: Watchlist,
  alerts: Alerts,
  notes: Notes,
  settings: Settings,
  help: Help,
  fx: Fx,
  rates: Rates,
  commodities: Commodities,
  fundamentals: Fundamentals,
  statements: Statements,
  screener: Screener,
  peers: Peers,
  learn: Learn,
  glossary: Glossary,
  insiders: Insiders,
  ratings: Ratings,
  earnings: Earnings,
  ipo: Ipo,
  dividends: Dividends,
  holdings: Holdings,
  short: ShortInt,
  heatmap: Heatmap,
  correlation: Correlation,
};
