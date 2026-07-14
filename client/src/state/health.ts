import { useCallback, useEffect, useState } from 'react';

export interface Health {
  ok: boolean;
  app: string;
  version: string;
  schemaVersion: number;
  node: string;
  time: string;
}

export type HealthState =
  | { status: 'loading' }
  | { status: 'up'; health: Health }
  | { status: 'down'; error: string };

/** Polls /api/health. pollMs = 0 fetches once (call refresh() manually after). */
export function useHealth(pollMs = 0): { state: HealthState; refresh: () => void } {
  const [state, setState] = useState<HealthState>({ status: 'loading' });

  const refresh = useCallback(() => {
    fetch('/api/health')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((health: Health) => setState({ status: 'up', health }))
      .catch((err: unknown) =>
        setState({ status: 'down', error: err instanceof Error ? err.message : 'unreachable' }),
      );
  }, []);

  useEffect(() => {
    refresh();
    if (pollMs > 0) {
      const id = setInterval(refresh, pollMs);
      return () => clearInterval(id);
    }
  }, [refresh, pollMs]);

  return { state, refresh };
}
