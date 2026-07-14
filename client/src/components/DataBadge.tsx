import type { Envelope } from '../../../shared/types';

function hhmmss(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour12: false });
}

/**
 * Freshness/source strip shown wherever market data renders. DEMO and STALE
 * are loud on purpose — honest labeling is a product constraint.
 */
export function DataBadge({ env }: { env: Envelope<unknown> }) {
  return (
    <span className="databadge">
      <span className="badge badge-src">{env.source.toUpperCase()}</span>
      <span className="badge">{hhmmss(env.asOf)}</span>
      {env.demo && <span className="badge badge-demo">DEMO DATA</span>}
      {env.delayed && !env.demo && <span className="badge badge-delayed">DELAYED</span>}
      {env.stale ? (
        <span className="badge badge-stale">STALE</span>
      ) : (
        env.fromCache && <span className="badge">CACHED</span>
      )}
    </span>
  );
}
