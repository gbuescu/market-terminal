import type { Envelope, Freshness } from '../../../shared/types';

function hhmmss(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour12: false });
}

const FRESHNESS_LABEL: Record<Freshness, string> = {
  realtime: 'REALTIME',
  'near-realtime': 'NEAR-RT',
  delayed: 'DELAYED',
  eod: 'EOD',
  official: 'OFFICIAL',
  synthetic: 'DEMO DATA',
};

/**
 * Freshness/source strip shown wherever market data renders. DEMO and STALE
 * are loud on purpose — honest labeling is a product constraint. REALTIME
 * only ever appears for genuine live-feed payloads.
 */
export function DataBadge({ env }: { env: Envelope<unknown> }) {
  const freshness: Freshness =
    env.freshness ?? (env.demo ? 'synthetic' : env.delayed ? 'delayed' : 'near-realtime');
  return (
    <span className="databadge">
      <span className="badge badge-src">{env.source.toUpperCase()}</span>
      <span className="badge">{hhmmss(env.asOf)}</span>
      <span className={`badge badge-fresh-${freshness === 'synthetic' ? 'demo' : freshness}`}>
        {FRESHNESS_LABEL[freshness]}
      </span>
      {env.stale ? (
        <span className="badge badge-stale">STALE</span>
      ) : (
        env.fromCache && <span className="badge">CACHED</span>
      )}
    </span>
  );
}
