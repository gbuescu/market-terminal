/**
 * Command parser: resolves `SYMBOL FUNCTION` / `FUNCTION SYMBOL` / `FUNCTION`
 * mnemonics, plus fuzzy plain-English suggestions over the registry.
 */
import { COMMANDS, type CommandDef, findCommand } from './registry';

export interface Invocation {
  def: CommandDef;
  symbol?: string;
  /** Canonical form, e.g. "AAPL Q" — used for tab titles and history. */
  canonical: string;
}

export interface Suggestion extends Invocation {
  score: number;
}

/** Ticker-ish tokens: AAPL, BRK.B, ^GSPC, EURUSD=X, BTC-USD, 7203:JP */
const SYMBOL_RE = /^[A-Z0-9.\-:^=/]{1,15}$/;

function canonicalOf(def: CommandDef, symbol?: string): string {
  return symbol ? `${symbol} ${def.mnemonic}` : def.mnemonic;
}

function makeInvocation(def: CommandDef, symbol?: string): Invocation {
  const sym = def.takesSymbol === 'none' ? undefined : symbol;
  return { def, symbol: sym, canonical: canonicalOf(def, sym) };
}

/** Strict parse. Returns null when the input is not an exact command. */
export function parse(input: string): Invocation | null {
  const tokens = input.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  if (tokens.length === 1) {
    const def = findCommand(tokens[0]);
    return def ? makeInvocation(def) : null;
  }

  // SYMBOL [SYMBOL...] FUNCTION  (Bloomberg-style, preferred)
  const last = findCommand(tokens[tokens.length - 1]);
  const head = tokens.slice(0, -1);
  if (
    last &&
    last.takesSymbol !== 'none' &&
    head.every((t) => SYMBOL_RE.test(t) && !findCommand(t))
  ) {
    return makeInvocation(last, head.join(' '));
  }

  // FUNCTION SYMBOL [SYMBOL...]
  const first = findCommand(tokens[0]);
  const tail = tokens.slice(1);
  if (first && first.takesSymbol !== 'none' && tail.every((t) => SYMBOL_RE.test(t))) {
    return makeInvocation(first, tail.join(' '));
  }

  return null;
}

function scoreDef(def: CommandDef, query: string): number {
  const tokens = [def.mnemonic, ...def.aliases];
  if (tokens.includes(query)) return 100;
  if (tokens.some((t) => t.startsWith(query))) return 80;
  const name = def.name.toUpperCase();
  if (name.startsWith(query)) return 70;
  if (query.length >= 2 && name.includes(query)) return 55;
  if (query.length >= 2 && def.keywords.some((k) => k.toUpperCase().startsWith(query))) return 45;
  if (query.length >= 3 && def.description.toUpperCase().includes(query)) return 30;
  return 0;
}

/** Ranked suggestions for partial input. Empty input yields no suggestions. */
export function suggest(input: string, limit = 8): Suggestion[] {
  const raw = input.trim().toUpperCase();
  if (!raw) return [];
  const tokens = raw.split(/\s+/);

  // Detect a "SYMBOL... partialFunction" shape: everything before the last
  // token looks like a symbol and is not itself a command.
  const head = tokens.slice(0, -1);
  const lastTok = tokens[tokens.length - 1];
  const symbolPrefix =
    head.length > 0 && head.every((t) => SYMBOL_RE.test(t) && !findCommand(t))
      ? head.join(' ')
      : undefined;

  const results: Suggestion[] = [];
  for (const def of COMMANDS) {
    if (symbolPrefix && def.takesSymbol === 'none') continue;
    // Multi-word plain-English queries (e.g. "ECONOMIC CALENDAR") match on
    // the whole input; symbol-prefixed queries match on the trailing token.
    const query = symbolPrefix ? lastTok : raw;
    let score = scoreDef(def, query);
    if (score === 0 && !symbolPrefix && tokens.length > 1) {
      score = Math.max(...tokens.map((t) => scoreDef(def, t))) - 10;
    }
    if (score <= 0) continue;
    const inv = makeInvocation(def, symbolPrefix);
    results.push({ ...inv, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
