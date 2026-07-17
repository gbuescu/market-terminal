# Session log

Append one entry per Claude Code session. Newest at the top.

---

## Session 9 — 2026-07-16 — Phase 8: Data expansion (near-real-time + research)

**Repo state at start:** Phase 7, commit `67885df`. No API keys on the dev
machine → strategy: live-verify everything keyless (EDGAR, heatmap,
correlation, budgeting), build key-gated adapters carefully (finnhub ws,
marketaux, FRED), be explicit about untested-until-key.

**Server (commit 8a):** EDGAR adapter (companyfacts XBRL, multi-tag merge —
fixed real bug where Apple's revenue tag transition nulled Revenue; verified
FY2025 rev 416.2B as filed, 8 quarterlies, 24 dividend quarters), finnhub
research endpoints + livequotes.ts websocket store (native Node WebSocket,
LRU 40-symbol smart subscriptions, backoff reconnect), marketaux (entity
sentiment), FRED (releases/dates), budget.ts + migration 005 request_log
(conservative budgets, BudgetError → stale cache, /api/usage), freshness
tier in envelope (cache hits never REALTIME), 8 new routes, statements
period param, holdings/short = NO default provider (honest 503), MKT_KEY_*
env fallback.

**Client (commit 8b):** DataBadge freshness tiers; 9 modules: INS, AR
(consensus + distribution bars), ERN (calendar/surprises dual-mode), IPO,
DIV (EDGAR TTM), HOLD + SI (honest unavailable states), HEAT (SPDR sector
tiles, live), CORR (local Pearson matrix over 6M returns, live); News
sentiment chips + entity tags + keyword topic filters; FS ANNUAL/QTR
toggle; SET usage panel (per-provider budgets + ws status) + marketaux key
field; sidebar RESEARCH section; 9 explainers; .env.example; npm scripts
use --env-file-if-exists=.env; README key table; DATA_PROVIDERS rewritten
(provider plan, fallback logic, budgets, honest gaps, deferred backups).

**Deferred (recorded):** Alpaca/Twelve Data/Marketstack backups (Marketstack
free = 100 req/MONTH), AI digest (paid LLM key — ask first), options IV /
transcripts / price targets / splits (no free source).

**Verified live:** EDGAR statements+dividends (real Apple filings), HEAT
12 tiles real sector moves, CORR real matrix (SPY/EFA 0.79, SPY/UUP −0.43),
usage counters counting, holdings 503, all demo paths, FS QTR (8 quarters),
News topic chips, SET usage panel. Finnhub/marketaux/FRED/ws paths compile +
follow the tested adapter pattern but need keys to verify.

**Key activation (2026-07-17):** user registered all four free keys; stored
in gitignored .env (MKT_KEY_*). Every keyed path then live-verified:
finnhub ratings (AAPL 2026-07: 23 buy/16 hold), insiders (real Form 4s,
60 rows), earnings surprises (+1.09% beat Q1'26), earnings calendar (120
events), IPO calendar (25); **websocket connected with 3 subscriptions**
and cleanly idle-closed after unsubscribe — full lifecycle observed;
marketaux news with real article+entity sentiment (AAPL +0.54); FRED 60
real releases (note: first call after boot can exceed the 10s fetch
timeout — retry/cache absorbs it); Alpha Vantage OVERVIEW (IBM, P/E 18.7)
then reverted fundamentals to auto (finnhub-first). Usage panel tracked
everything (finnhub 8/day, marketaux 1, fred 2, AV 1). quotes stays
yahoo-first on auto: finnhub free has no indices/FX, forcing it would
break the monitor — documented; force finnhub per-capability for US-only
work.

---

## Session 8 — 2026-07-16 — Phase 7: Advanced charting (post-v1)

**Repo state at start:** v1 complete (all 6 phases), commit `b6b67a3`.
User asked to "step up to phase 7" — no Phase 7 existed, so defined one
that stays in-constraint (read-only) and is testable with existing data:
advanced charting. No server changes (reuses /api/series).

**Built:**
- `lib/indicators.ts`: `sma(values, period)` (nulls until warmed up),
  `normalizePct(values)`.
- Rewrote `modules/Chart.tsx` into `ChartCanvas` + container:
  - crosshair on SVG mousemove → tooltip (OHLCV in price mode; date +
    per-series % in compare mode); vertical guide + per-series dots.
  - SMA50/SMA200 dashed overlays + legend (price mode only).
  - VOL subpanel (bars from candle.v) when volume present, price mode.
  - comparison: add up to 4 symbols (fetched via getEnvelope per symbol,
    refetch on range change), normalized % lines, shared % axis, legend
    with per-symbol return + remove ×. Adding a compare forces % mode;
    SMA/VOL/% toggles disabled while comparing.
  - toolbar: ranges + SMA50/SMA200/VOL/% toggle group; body has a
    "+ compare symbol" form.
- Styles: crosshair/tooltip/legend/volbar/series/toggle rules.
- Bonus fix (`state/workspace.tsx`): deep-link to a view absent from the
  saved layout now appends+activates it instead of being ignored.

**Verified (live Yahoo data, browser):** AAPL GP renders (last 327.50,
+28.16%/6M, 123 bars); SMA50+SMA200 → 2 dashed paths+legend; VOL → 123
bars; add MSFT → 2 series, % axis, legend AAPL +28.2% / MSFT -14.0%;
crosshair tooltip in both modes (price OHLCV + Vol; compare per-symbol %);
remove compare returns to price mode; deep-link reload to #/chart/NVDA
appended NVDA GP and activated it alongside the restored layout.
typecheck ✓ lint ✓ build ✓. Reset workspace layout to clean afterward.

**Next:** enhancement backlog in ROADMAP (FRED macro provider, tab
reorder, more screener metrics).

---

## Session 7 — 2026-07-15 — Phase 6: Polish (final phase)

**Repo state at start:** Phase 5 learning, commit `8b59355`.

**Built:**
- Layout persistence: migration 004 `ui_state` table; GET/PUT
  `/api/workspace` in domain.ts; `state/workspace.tsx` loads saved layout on
  boot (falls back to hash → MON) and saves open tabs + active index
  debounced (400ms). Hash deep-link still picks the active tab on restore.
- Notifications: `lib/notify.ts` (Notification API wrapper); StatusBar tracks
  triggered alert ids and notifies only on newly-crossed ones (seeds silently
  on first poll); opt-in ENABLE NOTIFICATIONS button in ALRT.
- CSV export: `lib/csv.ts` (RFC-ish quoting, downloadCsv, fileStamp) +
  `components/ExportButton.tsx`; wired into screener, watchlist, statements,
  calendar, and the FX/RATES/CMDTY QuoteBoard (lazy rows() → reflects
  current filter/sort).
- Error handling: `components/ErrorBoundary.tsx` wraps the active module
  (resetKey = tab id); server JSON 404 + central /api error middleware.
- run.ps1: added Wait-ForHealth (polls /api/health for 200 before opening
  the browser). README fully rewritten (command table, shortcuts, data
  honesty, persistence, troubleshooting, screenshots guidance).

**Verified:** typecheck ✓ lint ✓ build ✓; live: schema=4, JSON 404 returns
404, opened 4 tabs → persisted to /api/workspace → full page reload restored
all 4 with correct active tab; CSV intercept produced correct header + 28
rows; ENABLE NOTIFICATIONS renders in ALRT. Reset workspace layout to empty
afterwards for a clean first launch.

**Status:** all six build phases complete. Enhancement backlog (not phase
scope) noted in ROADMAP.

**Hotfix (same day, after user launch attempt):**
- User's PowerShell is `Restricted` → `.ps1` launch blocked. Added
  `run.cmd` / `setup.cmd` / `stop.cmd` batch wrappers that call the matching
  `.ps1` under `-ExecutionPolicy Bypass` (batch files aren't policy-blocked).
- Found `run.ps1` had never actually been executed in any prior session
  (servers were always started directly via `npm run start`). Its Phase 6
  edit left backtick line-continuations that Windows PowerShell 5.1 failed to
  parse ("Unexpected token '}'"). Rewrote `run.ps1` ASCII-only with no
  backtick continuations (command assigned to a variable, single-line
  Start-Process). All three scripts now pass `Parser::ParseFile`.
- Verified: `run.cmd -Prod` builds, starts API, health check passes, serves
  index on :4780. README + CLAUDE.md document the wrapper + the ASCII/no-
  backtick rule.

---

## Session 6 — 2026-07-15 — Phase 5: Learning workflow

**Repo state at start:** Phase 4 analytics, commit `191ed6f` (+docs fix).

**Built:**
- GLOS glossary module: 48 curated terms across MARKETS / VALUATION /
  STATEMENTS / FIXED INCOME / FX & MACRO / RISK & DERIVATIVES
  (config/glossary.ts), search + category chips, "see it: AAPL FA →" links
  execute real commands. Optional-symbol trick gives "BETA GLOS" filtered
  deep links.
- LEARN module: 9-step guided tour (TRY IT buttons run real commands,
  MARK DONE persists progress; completing the tour also marks onboarding
  done) + mnemonic trainer (questions generated per round, answers graded
  by the real parser so aliases count; streak + persisted best).
- Student mode: config/explainers.ts (one plain-English line per module),
  strip rendered by ModuleFrame, STUDENT topbar tag, toggle in LEARN.
- Onboarding: first-run banner under the topbar (START TOUR / DISMISS),
  hidden once learn.onboarded is set.
- state/student.tsx context persists all learning state via the settings
  table (new whitelisted keys: learn.onboarded, learn.studentmode,
  learn.progress, learn.streak). Sidebar gained a LEARNING section
  (LEARN, GLOS, HELP); SET remains under SYSTEM.

**Verified:** typecheck ✓ lint ✓ build ✓; browser: onboarding banner on
first boot, START TOUR opens LEARN, trainer graded alias "YIELDS" as
correct → RATES with streak persisting to SQLite, student-mode toggle
shows STUDENT tag + explainer strips, "#/glossary/BETA" filters to 1/48
terms. Test-set studentmode flag reset afterwards (streak=1 left as
genuine state).

**Next session:** Phase 6 — polish (layout persistence, better error
handling, notifications, CSV export, screenshots, README hardening,
launch reliability).

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
