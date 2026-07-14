import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SymbolInfo } from '../../../shared/types';
import { getEnvelope } from '../api/client';
import { type Invocation, parse, suggest } from '../commands/parser';
import { useWorkspace } from '../state/workspace';

type Item =
  | { kind: 'recent'; input: string }
  | { kind: 'command'; inv: Invocation; name: string; desc: string }
  | { kind: 'symbol'; info: SymbolInfo };

export function CommandBar() {
  const ws = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [sel, setSel] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);

  const suggestions = useMemo(() => suggest(value), [value]);
  const showRecents = value.trim() === '' && ws.recents.length > 0;

  // Debounced symbol search — only when the input is not already an exact
  // command (e.g. "AAPL Q" parses; "apple" searches).
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2 || parse(q)) {
      setSymbols([]);
      return;
    }
    const id = setTimeout(() => {
      getEnvelope<SymbolInfo[]>(`/api/search?q=${encodeURIComponent(q)}`)
        .then((env) => setSymbols(env.data.slice(0, 6)))
        .catch(() => setSymbols([]));
    }, 300);
    return () => clearTimeout(id);
  }, [value]);

  const items = useMemo<Item[]>(() => {
    if (showRecents) return ws.recents.slice(0, 8).map((input) => ({ kind: 'recent', input }));
    const cmd: Item[] = suggestions.map((s) => ({
      kind: 'command',
      inv: s,
      name: s.def.name,
      desc: s.def.description,
    }));
    const seen = new Set(suggestions.map((s) => s.symbol).filter(Boolean));
    const sym: Item[] = symbols
      .filter((s) => !seen.has(s.symbol))
      .map((info) => ({ kind: 'symbol', info }));
    return [...cmd, ...sym];
  }, [showRecents, ws.recents, suggestions, symbols]);

  const open = focused && items.length > 0;

  const runInvocation = useCallback(
    (inv: Invocation) => {
      ws.execute(inv);
      setValue('');
      setSel(0);
      setNotFound(false);
      setSymbols([]);
      inputRef.current?.blur();
    },
    [ws],
  );

  const runItem = useCallback(
    (item: Item) => {
      if (item.kind === 'recent') {
        const inv = parse(item.input);
        if (inv) runInvocation(inv);
      } else if (item.kind === 'command') {
        runInvocation(item.inv);
      } else {
        const inv = parse(`${item.info.symbol} Q`);
        if (inv) runInvocation(inv);
      }
    },
    [runInvocation],
  );

  const submit = useCallback(() => {
    const item = items[sel] ?? items[0];
    if (item) {
      runItem(item);
      return;
    }
    const exact = parse(value);
    if (exact) runInvocation(exact);
    else setNotFound(true);
  }, [items, sel, value, runItem, runInvocation]);

  const complete = useCallback((item: Item | undefined) => {
    if (!item) return;
    if (item.kind === 'recent') setValue(item.input);
    else if (item.kind === 'command') setValue(item.inv.canonical);
    else setValue(`${item.info.symbol} `);
    setSel(0);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSel((s) => Math.min(s + 1, items.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSel((s) => Math.max(s - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      submit();
      e.preventDefault();
    } else if (e.key === 'Tab') {
      complete(items[sel]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  // Global focus shortcuts: '/' or Ctrl+K; bare typing starts a command.
  useEffect(() => {
    const onWindowKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el.isContentEditable;
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (typing || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        // Focus before the keypress lands so the character flows into the input.
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onWindowKey);
    return () => window.removeEventListener('keydown', onWindowKey);
  }, []);

  let runningIndex = -1;
  const renderItem = (item: Item) => {
    runningIndex++;
    const i = runningIndex;
    const cls = `cmd-item${i === sel ? ' cmd-item-sel' : ''}`;
    if (item.kind === 'recent') {
      return (
        <button
          type="button"
          key={`r-${item.input}`}
          className={cls}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runItem(item)}
        >
          <span className="cmd-item-mnemonic">{item.input}</span>
        </button>
      );
    }
    if (item.kind === 'command') {
      return (
        <button
          type="button"
          key={`c-${item.inv.canonical}`}
          className={cls}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => runItem(item)}
        >
          <span className="cmd-item-mnemonic">{item.inv.canonical}</span>
          <span className="cmd-item-name">{item.name}</span>
          <span className="cmd-item-desc">{item.desc}</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        key={`s-${item.info.symbol}`}
        className={cls}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => runItem(item)}
      >
        <span className="cmd-item-mnemonic">{item.info.symbol}</span>
        <span className="cmd-item-name">{item.info.name}</span>
        <span className="cmd-item-desc">
          {item.info.assetClass}
          {item.info.exchange ? ` · ${item.info.exchange}` : ''} → opens quote
        </span>
      </button>
    );
  };

  const commandItems = items.filter((i) => i.kind !== 'symbol');
  const symbolItems = items.filter((i) => i.kind === 'symbol');

  return (
    <div className="cmdwrap">
      <span className="cmd-prompt">&gt;</span>
      <input
        ref={inputRef}
        className={`cmd-input${notFound ? ' cmd-error' : ''}`}
        value={value}
        placeholder='Type a command or search — "AAPL Q", "apple", HELP'
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => {
          setValue(e.target.value);
          setSel(0);
          setNotFound(false);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        onKeyDown={onKeyDown}
        aria-label="Command"
      />
      {notFound && <span className="cmd-notfound">unknown — try HELP</span>}
      {open && (
        <div className="cmd-dropdown">
          {showRecents && <div className="cmd-section">RECENT</div>}
          {commandItems.map(renderItem)}
          {symbolItems.length > 0 && <div className="cmd-section">SYMBOLS</div>}
          {symbolItems.map(renderItem)}
          <div className="cmd-hint">↑↓ select · Enter run · Tab complete · Esc close</div>
        </div>
      )}
    </div>
  );
}
