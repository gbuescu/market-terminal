/**
 * Finnhub websocket live-trade store. This is the only true REALTIME feed
 * in the terminal, and it only runs when a Finnhub key is configured.
 *
 * Smart-subscription model: every /api/quotes request through the finnhub
 * provider "touches" its symbols; touched symbols get subscribed on the
 * socket (capped, LRU) and symbols idle for 2 minutes are unsubscribed —
 * so we stream only what is actually on screen. Trades update an in-memory
 * last-price map; the finnhub REST adapter serves from it when fresh,
 * skipping REST calls entirely (fewer requests, lower latency).
 *
 * Reconnect: exponential backoff 1s→60s, resubscribes on open. Uses Node's
 * built-in WebSocket (Node >= 22) — no new dependency.
 * NOTE: untested without a key on the dev machine; verify on first live use.
 */
import type { Quote } from '../../shared/types.ts';

const MAX_SUBSCRIPTIONS = 40; // finnhub free allows 50; keep headroom
const IDLE_MS = 2 * 60_000;

interface LiveEntry {
  price: number;
  ts: number; // epoch ms of the trade
  prevClose?: number; // seeded from the last REST quote for change calc
}

const live = new Map<string, LiveEntry>();
const lastTouched = new Map<string, number>();
const subscribed = new Set<string>();

let ws: WebSocket | null = null;
let keyProvider: (() => string | null) | null = null;
let backoffMs = 1_000;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let sweepTimer: ReturnType<typeof setInterval> | null = null;

/** Only plain US-style tickers go on the trade socket. */
const WS_SYMBOL = /^[A-Z0-9.]{1,10}$/;

function send(obj: unknown): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(obj));
    } catch {
      /* socket raced shut; reconnect logic will recover */
    }
  }
}

function connect(): void {
  const key = keyProvider?.();
  if (!key || ws) return;
  try {
    ws = new WebSocket(`wss://ws.finnhub.io?token=${encodeURIComponent(key)}`);
  } catch (err) {
    console.warn('[live] websocket construct failed:', err);
    ws = null;
    scheduleReconnect();
    return;
  }
  ws.addEventListener('open', () => {
    backoffMs = 1_000;
    console.log(`[live] finnhub websocket connected (${subscribed.size} subscriptions)`);
    for (const s of subscribed) send({ type: 'subscribe', symbol: s });
  });
  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(String(ev.data)) as {
        type?: string;
        data?: { s?: string; p?: number; t?: number }[];
      };
      if (msg.type !== 'trade' || !msg.data) return;
      for (const t of msg.data) {
        if (!t.s || typeof t.p !== 'number') continue;
        const prev = live.get(t.s);
        live.set(t.s, { price: t.p, ts: t.t ?? Date.now(), prevClose: prev?.prevClose });
      }
    } catch {
      /* ignore malformed frames */
    }
  });
  const onDown = () => {
    ws = null;
    scheduleReconnect();
  };
  ws.addEventListener('close', onDown);
  ws.addEventListener('error', onDown);
}

function scheduleReconnect(): void {
  // Only reconnect while something is subscribed and a key still exists.
  if (reconnectTimer || subscribed.size === 0 || !keyProvider?.()) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, backoffMs);
  backoffMs = Math.min(backoffMs * 2, 60_000);
}

function sweepIdle(): void {
  const cutoff = Date.now() - IDLE_MS;
  for (const s of subscribed) {
    if ((lastTouched.get(s) ?? 0) < cutoff) {
      subscribed.delete(s);
      send({ type: 'unsubscribe', symbol: s });
    }
  }
  if (subscribed.size === 0 && ws) {
    ws.close();
    ws = null;
  }
}

/** Wire up the key source once at boot (avoids a settings import cycle). */
export function initLiveQuotes(getKey: () => string | null): void {
  keyProvider = getKey;
  if (!sweepTimer) sweepTimer = setInterval(sweepIdle, 30_000);
}

/** Mark symbols as on-screen; subscribes new ones (LRU-capped). */
export function touchSymbols(symbols: string[]): void {
  if (!keyProvider?.()) return;
  const now = Date.now();
  for (const s of symbols) {
    if (!WS_SYMBOL.test(s)) continue;
    lastTouched.set(s, now);
    if (!subscribed.has(s)) {
      if (subscribed.size >= MAX_SUBSCRIPTIONS) {
        let oldest: string | null = null;
        let oldestTs = Number.POSITIVE_INFINITY;
        for (const sub of subscribed) {
          const t = lastTouched.get(sub) ?? 0;
          if (t < oldestTs) {
            oldestTs = t;
            oldest = sub;
          }
        }
        if (oldest) {
          subscribed.delete(oldest);
          send({ type: 'unsubscribe', symbol: oldest });
        }
      }
      subscribed.add(s);
      send({ type: 'subscribe', symbol: s });
    }
  }
  if (!ws) connect();
}

/** Seed prev-close so ws trades can report change vs yesterday. */
export function seedPrevClose(symbol: string, prevClose: number): void {
  const e = live.get(symbol);
  if (e) e.prevClose = prevClose;
  else live.set(symbol, { price: prevClose, ts: 0, prevClose });
}

/** A quote from the live feed if we have a trade fresher than maxAgeMs. */
export function liveQuote(symbol: string, maxAgeMs: number): Quote | null {
  const e = live.get(symbol);
  if (!e || e.ts === 0 || Date.now() - e.ts > maxAgeMs) return null;
  const change = e.prevClose !== undefined ? e.price - e.prevClose : 0;
  return {
    symbol,
    price: e.price,
    change,
    changePct: e.prevClose ? (change / e.prevClose) * 100 : 0,
    prevClose: e.prevClose,
    ts: new Date(e.ts).toISOString(),
  };
}

export function liveStatus(): { connected: boolean; subscriptions: number } {
  return { connected: ws?.readyState === WebSocket.OPEN, subscriptions: subscribed.size };
}
