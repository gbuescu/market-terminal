import type { ComponentType } from 'react';
import type { ModuleId } from '../commands/registry';
import type { Tab } from '../state/workspace';
import { Alerts } from './Alerts';
import { Calendar } from './Calendar';
import { Chart } from './Chart';
import { Commodities } from './Commodities';
import { Fundamentals } from './Fundamentals';
import { Fx } from './Fx';
import { Glossary } from './Glossary';
import { Help } from './Help';
import { Learn } from './Learn';
import { Monitor } from './Monitor';
import { News } from './News';
import { Notes } from './Notes';
import { Peers } from './Peers';
import { Quote } from './Quote';
import { Rates } from './Rates';
import { Screener } from './Screener';
import { Settings } from './Settings';
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
};
