/**
 * Provider registry. Selection per capability:
 *   1. A provider forced via settings (`provider.<capability>`) wins if ready.
 *   2. Otherwise the default priority order below, first ready provider.
 * Fall-through between providers happens ONLY on `Unsupported` — a live
 * provider's network/data failure is surfaced (or served stale from cache),
 * never silently replaced with demo data.
 */
import type { ProviderInfo } from '../../shared/types.ts';
import { getSetting, isSettingKey } from '../settings.ts';
import { demoProvider } from './demo.ts';
import type { Capability, Provider } from './types.ts';
import { yahooProvider } from './yahoo.ts';

export const PROVIDERS: readonly Provider[] = [yahooProvider, demoProvider];

const DEFAULT_ORDER: Record<Capability, string[]> = {
  search: ['yahoo', 'demo'],
  quotes: ['yahoo', 'demo'],
  series: ['yahoo', 'demo'],
  news: ['yahoo', 'demo'],
  calendar: ['demo'],
};

function byId(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** Ordered candidate providers for a capability (forced choice first). */
export function pickProviders(cap: Capability): Provider[] {
  const settingKey = `provider.${cap}`;
  const forcedId = isSettingKey(settingKey) ? getSetting(settingKey) : null;
  const ordered: Provider[] = [];
  if (forcedId && forcedId !== 'auto') {
    const forced = byId(forcedId);
    if (forced?.ready() && forced.capabilities.includes(cap)) {
      // Forced provider is exclusive: no fall-through to others, so a user
      // who forces 'demo' never accidentally sees live data and vice versa.
      return [forced];
    }
  }
  for (const id of DEFAULT_ORDER[cap]) {
    const p = byId(id);
    if (p?.ready() && p.capabilities.includes(cap)) ordered.push(p);
  }
  return ordered;
}

export function describeProviders(): ProviderInfo[] {
  return PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    ready: p.ready(),
    capabilities: [...p.capabilities],
    delaySeconds: p.delaySeconds,
    note: p.note,
  }));
}
