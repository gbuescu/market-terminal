import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Invocation, parse, suggest } from '../commands/parser';
import { useWorkspace } from '../state/workspace';

export function CommandBar() {
  const ws = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [sel, setSel] = useState(0);
  const [notFound, setNotFound] = useState(false);

  const suggestions = useMemo(() => suggest(value), [value]);
  const showRecents = value.trim() === '' && ws.recents.length > 0;
  const open = focused && (suggestions.length > 0 || showRecents);
  const itemCount = showRecents ? Math.min(ws.recents.length, 8) : suggestions.length;

  const run = useCallback(
    (inv: Invocation) => {
      ws.execute(inv);
      setValue('');
      setSel(0);
      setNotFound(false);
      inputRef.current?.blur();
    },
    [ws],
  );

  const submit = useCallback(() => {
    if (showRecents) {
      const inv = parse(ws.recents[sel] ?? '');
      if (inv) run(inv);
      return;
    }
    const exact = parse(value);
    const chosen = suggestions[sel] ?? suggestions[0];
    // A selected suggestion wins; otherwise fall back to strict parse.
    if (chosen) run(chosen);
    else if (exact) run(exact);
    else setNotFound(true);
  }, [showRecents, ws.recents, sel, value, suggestions, run]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSel((s) => Math.min(s + 1, itemCount - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSel((s) => Math.max(s - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      submit();
      e.preventDefault();
    } else if (e.key === 'Tab' && !showRecents && suggestions[sel]) {
      setValue(suggestions[sel].canonical);
      setSel(0);
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

  return (
    <div className="cmdwrap">
      <span className="cmd-prompt">&gt;</span>
      <input
        ref={inputRef}
        className={`cmd-input${notFound ? ' cmd-error' : ''}`}
        value={value}
        placeholder='Type a command — e.g. "AAPL Q", "news", HELP'
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
          {showRecents
            ? ws.recents.slice(0, 8).map((r, i) => (
                <button
                  type="button"
                  key={r}
                  className={`cmd-item${i === sel ? ' cmd-item-sel' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const inv = parse(r);
                    if (inv) run(inv);
                  }}
                >
                  <span className="cmd-item-mnemonic">{r}</span>
                </button>
              ))
            : suggestions.map((s, i) => (
                <button
                  type="button"
                  key={s.canonical}
                  className={`cmd-item${i === sel ? ' cmd-item-sel' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => run(s)}
                >
                  <span className="cmd-item-mnemonic">{s.canonical}</span>
                  <span className="cmd-item-name">{s.def.name}</span>
                  <span className="cmd-item-desc">{s.def.description}</span>
                </button>
              ))}
          <div className="cmd-hint">↑↓ select · Enter run · Tab complete · Esc close</div>
        </div>
      )}
    </div>
  );
}
