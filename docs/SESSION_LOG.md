# Session log

Append one entry per Claude Code session. Newest at the top.

---

## Session 5 — 2026-07-14 — Phase 4: Analytics modules

**Repo state at start:** Phase 3 core modules, commit `3f32548`.

**Provider decision (was flagged):** fundamentals/statements NOT scraped
from Yahoo (crumb-gated). Shipped key-gated `finnhub` (quotes+fundamentals)
and `alphavantage` (fundamentals+statements) adapters instead — they
activate when keys are saved in SET; demo covers everything with zero keys.
Both adapters are lightly tested (no keys on this machine) — verify on
first live use.

**Built:**
- Capabilities extended: fundamentals, statements (types, registry orders,
  settings whitelist provider.fundamentals/provider.statements).
- Demo provider: deterministic fundamentals + 3 statements × 4 annual
  periods for any symbol.
- Routes: /api/fundamentals (24h TTL), /api/statements (7d TTL),
  /api/screener (28-name SCREEN_UNIVERSE via fundamentals provider, 24h).
- Client: FA (profile + metric grids), FS (income/balance/cashflow toggle),
  SCR (filters: min cap/max P/E/min yield; sortable columns; symbol → FA),
  RV (up to 6 symbols side-by-side; "AAPL RV" seeds), FX/RATES/CMDTY
  dashboards on shared QuoteBoard (rows click through to GP), sidebar
  ANALYTICS section, Quote toolbar gained FA.

**Verified:** typecheck ✓ lint ✓ build ✓; endpoints: fundamentals/
statements/screener correct demo envelopes; all 17 new dashboard symbols
resolve on live yahoo (Treasury curve 3.70→5.09%, FX crosses, silver, corn,
SOL); browser: FA page with DEMO badge, SCR 28 sortable rows, RATES live
curve.

**Next session:** Phase 5 — learning workflow (command cheat sheet exists
in HELP; add finance glossary, student mode, onboarding/tutorial panel,
mnemonic training).

---

## Session 4 — 2026-07-14 — Phase 3: Core modules

**Repo state at start:** Phase 2 data layer, commit `cf8bb3d`.

**Built:**
- Migration 003: `watchlists`, `watchlist_items` (FK cascade; foreign_keys
  pragma now ON), `notes`, `alerts` (status CHECK constraints; deliberately
  no order/trade shape anywhere in the schema).
- `server/domain.ts`: CRUD routers — watchlists (+items), notes (symbol-
  scoped optional), alerts (create/dismiss/delete + POST /alerts/evaluate).
  Plain JSON (not envelopes — local user data, not market data).
- `server/alerts.ts`: evaluation engine, 60s interval + 5s-after-boot pass,
  prices active alerts through the normal provider registry, marks rows
  triggered with price/time. Notify-only, enforced in code and comments.
- Client: Watchlist module (multi-list, live-quoted rows, add/remove,
  symbol→Q cross-nav), Notes module (list + editor, "NVDA NOTE" scoping),
  Alerts module (create form, active/triggered tables, dismiss), StatusBar
  "⚠ N ALERTS TRIGGERED" flag (opens ALRT), Quote toolbar GP/N/ALRT
  cross-nav, registry: ALRT now takes an optional symbol.

**Verified:** typecheck ✓ lint ✓ build ✓; API: watchlist/notes CRUD round-
trips, alert engine triggered a level-1 AAPL alert @ live 317.31 while
leaving a 99999 alert active; browser: watchlist with live quotes, alerts
center sections, status-bar flag. Test alerts/note cleaned up; "Tech"
starter watchlist left in place.

**Next session:** Phase 4 — analytics modules (equity screener, peer
compare, fundamentals, statements, rates/FX/commodities dashboards).
Note: these need a fundamentals-capable provider (Finnhub/Alpha Vantage
keys, or extend yahoo carefully) — decide at session start.

---

## Session 3 — 2026-07-14 — Phase 2: Data layer

**Repo state at start:** Phase 1 shell, commit `62cec8e`.

**Built:**
- `shared/types.ts` — DTOs + Envelope shared by server and client.
- Server: `providers/types.ts` (Provider interface + typed `Unsupported`),
  `providers/demo.ts` (deterministic seeded universe, ~30 symbols, all 5
  capabilities), `providers/yahoo.ts` (unofficial keyless: search, quotes,
  series, per-symbol news), `providers/registry.ts` (per-capability priority
  + settings override; fall-through only on Unsupported), `cache.ts` (SQLite
  TTL + in-flight dedup + stale-serve), `settings.ts` (whitelisted keys,
  masking), migration 002 (cache table), data routes with envelope wrapper.
- Client: `api/client.ts` + `api/useData.ts` (useEnvelope hook),
  `DataBadge` (SOURCE/time/DEMO/DELAYED/CACHED/STALE), `lib/format.ts`,
  `config/monitor.ts`; live modules: Monitor (18 symbols, 6 regions, 60s
  poll), Quote (price panel + session stats, 30s poll), Chart (SVG line
  chart, 8 ranges), News (per-symbol yahoo / market-wide demo), Calendar
  (demo), Settings (provider table, per-capability selection, API-key
  storage); CommandBar symbol search (debounced /api/search → opens Q).

**Verified:** typecheck ✓ lint ✓ build ✓; endpoints: search/quotes/series/
news live from yahoo (real AAPL/^GSPC/EURUSD=X), market-wide news falls
through to demo correctly, calendar demo, settings PUT forces demo
(labeled) and back to auto; browser: monitor grid live, AAPL GP renders
123-bar 6M chart, SET page complete. Browser-pane screenshots still time
out (tooling quirk); verification via DOM text/JS.

**Next session:** Phase 3 — core modules (watchlists, notes, alerts center
with SQLite persistence; quote/chart/news/calendar polish).

---

## Session 2 — 2026-07-14 — Phase 1: App shell

**Repo state at start:** Phase 0 scaffold, commit `5b80407`.

**Built:**
- Command system: `client/src/commands/registry.ts` (10 mnemonics: MON, Q,
  GP, N, ECO, W, ALRT, NOTE, SET, HELP + aliases/keywords) and `parser.ts`
  (SYMBOL FUNCTION / FUNCTION SYMBOL / bare mnemonic + ranked fuzzy
  plain-English suggestions).
- Workspace: `state/workspace.tsx` — tab state (one tab per module+symbol,
  re-run activates), URL-hash routing (`#/quote/AAPL`) with back/forward
  support, document-title sync, recent-command history (optimistic local +
  POST to API).
- Shell components: CommandBar (suggestions dropdown, recents on empty
  focus, Tab-complete, unknown-command feedback, `/`+Ctrl+K+type-to-focus),
  Sidebar (4 sections), TabStrip (indices, middle-click close), StatusBar
  (health poll, NO TRADING line, shortcut hints), ModuleFrame + shared
  StateView (loading/empty/error/info).
- 10 placeholder modules; Settings (live health + provider table) and Help
  (cheat sheet auto-generated from the registry) are genuinely functional.
- Server: `server/routes.ts` — GET/POST `/api/commands/recent` (dedup,
  capped at 200 rows), health moved into router.

**Checks:** typecheck ✓ · lint ✓ · build ✓ · live interaction test in
browser ✓ (AAPL Q opens quote tab; fuzzy "calendar"→ECO; Alt+1 tab jump;
Alt+W close; hash `#/quote/AAPL`; recents round-trip through SQLite).
Known tooling note: Browser-pane screenshots timed out this session (pane
quirk); all verification done via DOM/JS inspection instead.

**Next session:** Phase 2 — data layer (provider adapter interfaces,
symbol search, quotes, series, news, calendar, caching, stale indicators,
settings for keys; demo/seed provider first so zero-key usage works).

---

## Session 1 — 2026-07-14 — Phase 0: Foundation

**Repo state at start:** empty (greenfield; created sibling to the unrelated
`polybot` project the session was launched from).

**Decisions locked** (details in ARCHITECTURE.md):
- React 19 + TS + Vite 7 client; Express 5 + TS server on Node native
  type-stripping (Node v26 on this machine); built-in `node:sqlite` for
  persistence (no native modules); Biome for lint/format; single npm package;
  ports API=4780 / Vite=5173; local browser app, no Electron.

**Built:**
- Full scaffold: client (dark terminal placeholder page polling
  `/api/health`), server (Express, health endpoint, SPA/static serving),
  `server/db.ts` (WAL SQLite + append-only migrations; migration 001 =
  settings + recent_commands).
- `setup.ps1` / `run.ps1` (dev + `-Prod`, port-aware, opens browser) /
  `stop.ps1` (kills by port 4780/5173).
- CLAUDE.md, README.md, docs/{ARCHITECTURE,ROADMAP,SESSION_LOG,DATA_PROVIDERS}.md

**Checks:** typecheck, lint, vite build, live launch (health endpoint +
rendered page) — see end of entry for results.

**Next session:** Phase 1 — app shell (sidebar, command bar, tab workspace,
status bar, routing, shortcuts, placeholder modules).
