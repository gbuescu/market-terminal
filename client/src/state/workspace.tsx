/**
 * Workspace state: open tabs, active tab, recent commands, and hash routing.
 * One tab per (module, symbol) pair — re-running a command activates the
 * existing tab instead of duplicating it.
 */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getJson, putJson } from '../api/client';
import { type Invocation, parse } from '../commands/parser';
import { MODULE_COMMAND, type ModuleId } from '../commands/registry';

interface PersistedTab {
  moduleId: ModuleId;
  symbol?: string;
  title: string;
}
interface Layout {
  tabs: PersistedTab[];
  activeIndex: number;
}

export interface Tab {
  id: string;
  moduleId: ModuleId;
  symbol?: string;
  title: string;
}

interface WorkspaceApi {
  tabs: Tab[];
  activeId: string | null;
  activeTab: Tab | null;
  recents: string[];
  execute: (inv: Invocation) => void;
  activate: (id: string) => void;
  activateIndex: (index: number) => void;
  cycle: (delta: 1 | -1) => void;
  closeTab: (id: string) => void;
  closeActive: () => void;
}

const WorkspaceContext = createContext<WorkspaceApi | null>(null);

function hashFor(tab: Tab): string {
  return `#/${tab.moduleId}${tab.symbol ? `/${encodeURIComponent(tab.symbol)}` : ''}`;
}

function invocationFromHash(hash: string): Invocation | null {
  const m = hash.match(/^#\/([a-z]+)(?:\/(.+))?$/);
  if (!m) return null;
  const def = MODULE_COMMAND[m[1] as ModuleId];
  if (!def) return null;
  const symbol = m[2] ? decodeURIComponent(m[2]).toUpperCase() : undefined;
  return parse(symbol ? `${symbol} ${def.mnemonic}` : def.mnemonic);
}

function recordRecent(canonical: string): void {
  fetch('/api/commands/recent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: canonical }),
  }).catch(() => {
    /* history is best-effort; the API may be down */
  });
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [recents, setRecents] = useState<string[]>([]);
  const activeTab = tabs.find((t) => t.id === activeId) ?? null;
  const suppressHashEvent = useRef(false);
  const hydrated = useRef(false);

  const openInvocation = useCallback((inv: Invocation, fromHistory = false) => {
    setTabs((prev) => {
      const existing = prev.find(
        (t) => t.moduleId === inv.def.moduleId && (t.symbol ?? '') === (inv.symbol ?? ''),
      );
      if (existing) {
        setActiveId(existing.id);
        return prev;
      }
      const tab: Tab = {
        id: crypto.randomUUID(),
        moduleId: inv.def.moduleId,
        symbol: inv.symbol,
        title: inv.canonical,
      };
      setActiveId(tab.id);
      return [...prev, tab];
    });
    if (!fromHistory) {
      setRecents((prev) =>
        [inv.canonical, ...prev.filter((r) => r !== inv.canonical)].slice(0, 20),
      );
      recordRecent(inv.canonical);
    }
  }, []);

  const execute = useCallback((inv: Invocation) => openInvocation(inv), [openInvocation]);

  const activate = useCallback((id: string) => setActiveId(id), []);

  const activateIndex = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (tab) setActiveId(tab.id);
    },
    [tabs],
  );

  const cycle = useCallback(
    (delta: 1 | -1) => {
      if (tabs.length < 2 || !activeId) return;
      const i = tabs.findIndex((t) => t.id === activeId);
      const next = tabs[(i + delta + tabs.length) % tabs.length];
      setActiveId(next.id);
    },
    [tabs, activeId],
  );

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const i = prev.findIndex((t) => t.id === id);
        if (i === -1) return prev;
        const next = prev.filter((t) => t.id !== id);
        if (id === activeId) {
          setActiveId(next.length ? next[Math.min(i, next.length - 1)].id : null);
        }
        return next;
      });
    },
    [activeId],
  );

  const closeActive = useCallback(() => {
    if (activeId) closeTab(activeId);
  }, [activeId, closeTab]);

  // Startup: restore the saved layout; else the URL hash; else the monitor.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let restored = false;
      try {
        const layout = await getJson<Layout>('/api/workspace');
        if (!cancelled && Array.isArray(layout.tabs) && layout.tabs.length > 0) {
          const restoredTabs: Tab[] = layout.tabs
            .filter((t) => MODULE_COMMAND[t.moduleId])
            .map((t) => ({
              id: crypto.randomUUID(),
              moduleId: t.moduleId,
              symbol: t.symbol,
              title: t.title,
            }));
          if (restoredTabs.length > 0) {
            // Prefer a specific deep-link in the hash; else the saved active tab.
            const hashInv = invocationFromHash(window.location.hash);
            const hashIdx = hashInv
              ? restoredTabs.findIndex(
                  (t) =>
                    t.moduleId === hashInv.def.moduleId &&
                    (t.symbol ?? '') === (hashInv.symbol ?? ''),
                )
              : -1;
            if (hashInv && hashIdx < 0) {
              // Deep-link points to a view not in the saved layout — open it too.
              const extra: Tab = {
                id: crypto.randomUUID(),
                moduleId: hashInv.def.moduleId,
                symbol: hashInv.symbol,
                title: hashInv.canonical,
              };
              setTabs([...restoredTabs, extra]);
              setActiveId(extra.id);
            } else {
              setTabs(restoredTabs);
              const idx =
                hashIdx >= 0
                  ? hashIdx
                  : Math.min(Math.max(layout.activeIndex, 0), restoredTabs.length - 1);
              setActiveId(restoredTabs[idx].id);
            }
            restored = true;
          }
        }
      } catch {
        /* no saved layout or API down */
      }
      if (!cancelled && !restored) {
        const inv = invocationFromHash(window.location.hash) ?? parse('MON');
        if (inv) openInvocation(inv, true);
      }
      hydrated.current = true;
    })();

    fetch('/api/commands/recent')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { input: string }[]) => {
        if (Array.isArray(rows))
          setRecents((prev) => (prev.length ? prev : rows.map((r) => r.input)));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [openInvocation]);

  // Persist layout (debounced) after hydration, so restarts reopen your tabs.
  useEffect(() => {
    if (!hydrated.current) return;
    const payload: Layout = {
      tabs: tabs.map((t) => ({ moduleId: t.moduleId, symbol: t.symbol, title: t.title })),
      activeIndex: Math.max(
        0,
        tabs.findIndex((t) => t.id === activeId),
      ),
    };
    const id = setTimeout(() => {
      putJson('/api/workspace', payload).catch(() => {
        /* best-effort */
      });
    }, 400);
    return () => clearTimeout(id);
  }, [tabs, activeId]);

  // Active tab -> URL hash + document title.
  useEffect(() => {
    if (!activeTab) return;
    const hash = hashFor(activeTab);
    if (window.location.hash !== hash) {
      suppressHashEvent.current = true;
      window.location.hash = hash;
    }
    document.title = `${activeTab.title} · MARKET TERMINAL`;
  }, [activeTab]);

  // Browser back/forward -> tabs.
  useEffect(() => {
    const onHashChange = () => {
      if (suppressHashEvent.current) {
        suppressHashEvent.current = false;
        return;
      }
      const inv = invocationFromHash(window.location.hash);
      if (inv) openInvocation(inv, true);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [openInvocation]);

  const api = useMemo<WorkspaceApi>(
    () => ({
      tabs,
      activeId,
      activeTab,
      recents,
      execute,
      activate,
      activateIndex,
      cycle,
      closeTab,
      closeActive,
    }),
    [
      tabs,
      activeId,
      activeTab,
      recents,
      execute,
      activate,
      activateIndex,
      cycle,
      closeTab,
      closeActive,
    ],
  );

  return <WorkspaceContext.Provider value={api}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceApi {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
