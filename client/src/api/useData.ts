import { useCallback, useEffect, useRef, useState } from 'react';
import type { Envelope } from '../../../shared/types';
import { getEnvelope } from './client';

export type DataState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; env: Envelope<T> };

/**
 * Fetches an envelope endpoint; optionally polls. Refetches when `path`
 * changes. Keeps the previous payload visible during background refreshes.
 */
export function useEnvelope<T>(
  path: string | null,
  pollMs = 0,
): { state: DataState<T>; refresh: () => void } {
  const [state, setState] = useState<DataState<T>>({ status: 'loading' });
  const generation = useRef(0);

  const load = useCallback((p: string, initial: boolean) => {
    const gen = ++generation.current;
    if (initial) setState({ status: 'loading' });
    getEnvelope<T>(p)
      .then((env) => {
        if (generation.current === gen) setState({ status: 'ready', env });
      })
      .catch((err: unknown) => {
        if (generation.current === gen) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'request failed',
          });
        }
      });
  }, []);

  useEffect(() => {
    if (!path) return;
    load(path, true);
    if (pollMs > 0) {
      const id = setInterval(() => load(path, false), pollMs);
      return () => clearInterval(id);
    }
  }, [path, pollMs, load]);

  const refresh = useCallback(() => {
    if (path) load(path, false);
  }, [path, load]);

  return { state, refresh };
}
