import type { ComponentType } from 'react';
import type { ModuleId } from '../commands/registry';
import type { Tab } from '../state/workspace';
import { Alerts } from './Alerts';
import { Calendar } from './Calendar';
import { Chart } from './Chart';
import { Help } from './Help';
import { Monitor } from './Monitor';
import { News } from './News';
import { Notes } from './Notes';
import { Quote } from './Quote';
import { Settings } from './Settings';
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
};
