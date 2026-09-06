# market-terminal — AI Handoff Document

**Purpose of this file:** a single, self-contained briefing so another AI
assistant (or a future session with no memory) can pick this project up cold
and work on it competently without re-deriving anything.

- **Document generated:** 2026-09-06, from a verified scan of the live repo.
- **Last active development:** 2026-07-17 (the code has been dormant ~7 weeks;
  it still runs — providers were re-verified live on 2026-09-06).
- **Repo:** a local Windows checkout. Paths below write `<repo>` for wherever
  it is cloned (the owner keeps it under their user profile).
- **Remote:** `https://github.com/gbuescu/market-terminal.git` (private)
- **State:** branch `master`, 15 commits, working tree clean, 96 tracked files,
  ~10,660 lines of TS/TSX/CSS across 75 source files, DB schema v5.

If anything in this document contradicts the code, **the code wins** — then fix
this document. Other docs in the repo (`CLAUDE.md`, `docs/ARCHITECTURE.md`,
`docs/ROADMAP.md`, `docs/SESSION_LOG.md`, `docs/DATA_PROVIDERS.md`,
`SECURITY.md`, `README.md`) go deeper on their specific topics; this file is
the map to all of them.

---

## 1. The one rule that overrides everything

> **This application is strictly read-only. It must never gain trade execution,
> order routing, broker integrations, an order ticket, position-entry forms, or
> any hidden/simulated version of those.**

This is a product constraint, not an unimplemented feature. It is stated in
`CLAUDE.md`, `SECURITY.md`, and the app's own status bar (“NO TRADING ·
RESEARCH & MONITORING ONLY”). Concretely:

- Alerts **notify only**. The alert engine writes a status row; it never acts.
- The database schema has **no order/trade/position shape anywhere** — this is
  deliberate and was verified during a security audit.
- A previous session declined to build a portfolio position-entry tracker on
  these grounds. Do the same.
- Only **read-only market-data** API keys belong here. Never broker or
  exchange-trading credentials.

If a user casually asks for trading features, flag the constraint rather than
silently complying.

**Secondary honesty rule (nearly as important):** never present data as fresher
or more authoritative than it is. See §5 (freshness tiers). Never fabricate
data to fill a gap — if no free source exists, the module says so (§8).

---

## 2. What the app is

A local, Bloomberg-inspired market terminal for Windows: a dense, dark,
keyboard-first browser app driven by a command bar with Bloomberg-style
mnemonics (`AAPL GP` = chart Apple). It covers market monitoring, quotes,
charting, news, economics, screening, fundamentals, filings-based financials,
research modules (insiders, ratings, earnings, IPOs, dividends), watchlists,
notes, notify-only alerts, and a finance-student learning mode.

It runs entirely on the user's machine: an Express API on **:4780** plus a
React client, with SQLite for persistence. It is usable with **zero API keys**
(keyless Yahoo + SEC EDGAR + a labeled demo provider), and unlocks more with
free keys.

Audience: the owner is a finance student; the learning mode (`LEARN`, `GLOS`,
student mode) is a first-class feature, not decoration.

---

## 3. Run it (Windows / PowerShell)

```powershell
cd <repo>            # wherever you cloned market-terminal
.\run.cmd -Prod      # build client once, serve everything from :4780
.\run.cmd            # dev mode: API :4780 + Vite :5173 (hot reload)
.\stop.cmd           # stop everything (kills by port)
.\setup.cmd          # one-time: verify Node >= 24, npm install
```

**Use the `.cmd` wrappers, not the `.ps1` files.** This machine's PowerShell
execution policy is `Restricted`, which blocks `.ps1` outright
("running scripts is disabled on this system"). The `.cmd` files are thin
batch wrappers that invoke the matching `.ps1` under
`-ExecutionPolicy Bypass`; batch files are not policy-blocked.

Other commands:

```powershell
npm run start        # API only (no watch)
npm run dev:server   # API with --watch
npm run dev:client   # Vite only
npm run build        # vite build client -> client/dist
npm run typecheck    # tsc --noEmit, client + server
npm run lint         # biome check .
npm run lint:fix     # biome check --write .
```

Health check: `Invoke-WebRequest http://localhost:4780/api/health -UseBasicParsing`

**Requirements:** Node **>= 24** (uses built-in `node:sqlite` and native
TypeScript execution — there is no server build step). Machine has v26.2.0.
No native npm modules, so no node-gyp pain on Windows.

**Server lifecycle trap:** if an AI assistant starts the server as a background
child of its own tool shell, it dies when that session ends and the UI then
shows "API unreachable / Failed to fetch" on every panel. For a long-lived
server, the **user** should launch it from their own terminal window.

---

## 4. Repo map

```
market-terminal/
├─ CLAUDE.md              # project context + non-negotiables (read first)
├─ HANDOFF.md             # this file
├─ README.md              # user-facing: quick start, commands, free-key guide
├─ SECURITY.md            # read-only posture, where secrets live
├─ .env.example           # placeholder keys + signup links (never real values)
├─ .env                   # REAL keys — gitignored, never commit
├─ .gitignore             # .env*, node_modules, dist, data/, *.db, .run/, IDE, OS junk
├─ biome.json             # lint+format: single quotes, 2-space, 100 cols
├─ package.json           # single npm package (no workspaces)
├─ setup.ps1 / run.ps1 / stop.ps1        # PowerShell lifecycle
├─ setup.cmd / run.cmd / stop.cmd        # execution-policy-proof wrappers
├─ shared/
│  └─ types.ts            # DTOs shared by client+server (Envelope, Quote, …)
├─ server/
│  ├─ index.ts            # Express app, /api mount, static client, error mw
│  ├─ routes.ts           # market-data routes + serveData() envelope wrapper
│  ├─ domain.ts           # CRUD: watchlists, notes, alerts, workspace layout
│  ├─ db.ts               # node:sqlite + append-only migrations (v5)
│  ├─ cache.ts            # SQLite TTL cache, in-flight dedup, stale-serve
│  ├─ budget.ts           # free-tier request budgeting + usage report
│  ├─ alerts.ts           # 60s notify-only alert evaluation engine
│  └─ providers/
│     ├─ types.ts         # Provider interface, Capability union, Unsupported
│     ├─ registry.ts      # per-capability priority + settings override
│     ├─ demo.ts          # deterministic synthetic data (all capabilities)
│     ├─ yahoo.ts         # keyless delayed quotes/series/search/news
│     ├─ edgar.ts         # SEC XBRL statements + dividends (keyless, official)
│     ├─ finnhub.ts       # keyed: quotes, fundamentals, research endpoints
│     ├─ livequotes.ts    # Finnhub websocket live-trade store (only REALTIME)
│     ├─ marketaux.ts     # keyed: news + entity sentiment
│     ├─ fred.ts          # keyed: official US economic release calendar
│     └─ alphavantage.ts  # keyed: statements/fundamentals backup (non-US)
├─ client/
│  ├─ index.html, vite.config.ts (port 5173, proxies /api -> :4780)
│  └─ src/
│     ├─ App.tsx          # shell: topbar, sidebar, tabs, error boundary
│     ├─ commands/        # registry.ts (mnemonics) + parser.ts (SYMBOL FUNC)
│     ├─ api/             # client.ts (fetch helpers), useData.ts (useEnvelope)
│     ├─ components/      # CommandBar, Sidebar, TabStrip, StatusBar,
│     │                   # ModuleFrame+StateView, DataBadge, QuoteBoard,
│     │                   # ErrorBoundary, ExportButton
│     ├─ config/          # monitor.ts (board symbols), glossary.ts, explainers.ts
│     ├─ lib/             # format.ts, csv.ts, indicators.ts (SMA), notify.ts
│     ├─ modules/         # 28 modules, one file each + index.ts registry
│     ├─ state/           # workspace.tsx (tabs/routing/layout), health, student
│     └─ styles.css       # all styling; design tokens at the top
├─ docs/
│  ├─ ARCHITECTURE.md     # locked decisions + rationale (read before refactors)
│  ├─ ROADMAP.md          # phase log + enhancement backlog
│  ├─ SESSION_LOG.md      # per-session history, newest first
│  └─ DATA_PROVIDERS.md   # every source, limits, fallback logic, honest gaps
├─ data/                  # terminal.db (SQLite) — gitignored
└─ .run/                  # pids + server.log / client.log — gitignored
```

---

## 5. Architecture: rules that must not be broken

These were established early and deliberately. Don't redesign them; extend them.

### 5.1 Provider abstraction
All market data flows through adapters in `server/providers/` implementing the
`Provider` interface. **UI never calls an external API directly** and contains
no provider-specific logic. Adding a source = adding one adapter file + a
registry entry.

### 5.2 The Envelope
Every `/api` market-data response is wrapped:

```ts
{ data, source, asOf, delayed, freshness, fromCache, stale, demo }
```

All such routes go through `serveData()` in `server/routes.ts`. The client
renders the envelope via `<DataBadge>`. **Any new data route must use
`serveData()`** so labeling stays uniform.

### 5.3 Freshness tiers (honesty)
`Freshness = 'realtime' | 'near-realtime' | 'delayed' | 'eod' | 'official' | 'synthetic'`

- `realtime` — **only** from the Finnhub websocket trade feed.
- A cache hit is automatically demoted from `realtime` → `near-realtime`.
- `official` = regulatory source (SEC/Fed): authoritative, filing cadence.
- `synthetic` renders as a loud amber **DEMO DATA** badge.

Never widen these semantics to make a source look better than it is.

### 5.4 The fallback honesty rule
Providers fall through to the next candidate **only** on the typed
`Unsupported` error (meaning "this provider can't serve this *shape* of
request", e.g. market-wide news from a per-symbol source).

A live provider's **network/data failure never silently becomes demo data.**
Instead: serve a flagged stale cache entry, or surface a real error with a hint
to switch providers in `SET`. This is the single most important data rule after
the no-trading constraint.

### 5.5 Command registry + parser
`client/src/commands/registry.ts` is the single source of truth for commands.
Adding a command = adding one registry entry (mnemonic, aliases, name,
description, moduleId, takesSymbol, keywords, examples) + a module in
`modules/index.ts`. Never scatter command strings through the UI. `HELP` and
the mnemonic trainer are generated from this registry, so they can't drift.

`parser.ts` resolves `SYMBOL FUNCTION` (preferred), `FUNCTION SYMBOL`, bare
mnemonics, and ranked fuzzy plain-English (`economic calendar` → `ECO`).

### 5.6 UI conventions
Dark-first, dense, terminal aesthetic. Tabular numerals for all numbers.
Keyboard-first. No marketing cards or hero sections. Every module wraps in
`<ModuleFrame>` and uses `<StateView>` for loading/empty/error/info states.
Design tokens live at the top of `styles.css` (`--bg`, `--accent` amber,
`--up` green, `--down` red, etc.).

---

## 6. Data layer

### 6.1 Providers (as configured)

| Provider | Capabilities | Key | Freshness | Budget (vs published) | Status |
|---|---|---|---|---|---|
| `yahoo` | search, quotes, series, news (per-symbol) | none | DELAYED (≤15 min) | 60/min self-imposed | Live-verified. Unofficial endpoints; may break. Covers indices/FX/futures/global. |
| `edgar` | statements (annual+quarterly), dividends | none | OFFICIAL | 240/min (SEC allows 10/sec) | Live-verified vs real Apple/MSFT filings. US filers only. |
| `finnhub` | quotes (+**websocket**), fundamentals, insiders, ratings, earnings, earnings calendar, IPO calendar | free key | NEAR-RT (REALTIME via ws) | 50/min (limit 60) | Live-verified incl. full websocket lifecycle. |
| `marketaux` | news + entity sentiment | free key | NEAR-RT | 10/min, 90/day (limit 100/day) | Live-verified. Only 3 articles/response on free tier. |
| `fred` | calendar (US releases) | free key | OFFICIAL | 60/min | Live-verified. First call after boot can exceed the 10s timeout. |
| `alphavantage` | fundamentals, statements | free key | EOD | 4/min, 20/day (limit 5/min, 25/day) | Live-verified once (IBM). Non-US statements backup. |
| `demo` | everything | none | DEMO DATA | — | Deterministic synthetic; fictional names only. |

### 6.2 Selection order (`server/providers/registry.ts`)

```
search        yahoo → demo
quotes        yahoo → finnhub → demo
series        yahoo → demo
news          marketaux → yahoo → demo
calendar      fred → demo
fundamentals  finnhub → alphavantage → demo
statements    edgar → alphavantage → demo
dividends     edgar → demo
insiders / ratings / earnings / earningscal / ipo    finnhub → demo
holdings / short    (empty — no default, deliberate)
```

**Why quotes is yahoo-first even though finnhub is fresher:** the Finnhub free
tier has no indices, FX, or futures. Forcing finnhub globally blanks the
markets monitor (`MON`), FX, RATES and CMDTY boards. Users who want
near-real-time US equities should force `quotes → finnhub` per-capability in
`SET`. Don't "fix" this by reordering the default.

Users override per capability via the `provider.<capability>` setting
('auto' or a provider id). **A forced provider is exclusive** — no fall-through
— so forcing `demo` never accidentally shows live data and vice versa.

### 6.3 Request budgeting (`server/budget.ts`)
Every outbound provider call calls `spendRequest(provider)` first, which logs
it to the `request_log` table and throws `BudgetError` if a conservative
per-minute/per-day budget is exhausted. Budgets sit **below** published
free-tier limits — these are safeguards, never ToS workarounds. On exhaustion
the cache serves stale data (flagged) rather than hammering the provider.
`GET /api/usage` reports counts + remaining quota; `SET` renders it.

### 6.4 Caching (`server/cache.ts`)
SQLite-backed TTL cache with in-flight deduplication and **stale-serve**: if a
refresh fails and an expired entry exists, it's returned with `stale: true`.
Cache keys include the provider id so forcing a provider never mixes payloads.

TTLs: search 24h · quotes 30s · series 15m (1D: 5m) · news 5m · calendar 6h ·
fundamentals 24h · statements 7d annual / 1d quarterly · dividends 24h ·
insiders 6h · ratings/earnings 24h · erncal/ipo 6h · EDGAR companyfacts 6h ·
EDGAR ticker→CIK map 24h.

### 6.5 Websocket live quotes (`server/providers/livequotes.ts`)
The only true REALTIME path. Uses Node's built-in `WebSocket` (no dependency).
Smart subscription model: each `/api/quotes` request through the finnhub
provider "touches" its symbols; touched symbols are subscribed (LRU, cap 40,
free tier allows 50), and symbols idle for 2 minutes are unsubscribed. Trades
update an in-memory last-price map; the REST adapter serves from it when a
trade is <5s old, skipping the REST call. Reconnect: exponential backoff
1s→60s, resubscribes on open. Only runs when a Finnhub key exists.

---

## 7. Command reference (28 commands)

Grammar: `SYMBOL FUNCTION` (e.g. `AAPL GP`), `FUNCTION SYMBOL`, bare mnemonic,
or plain-English fuzzy search. Source of truth: `client/src/commands/registry.ts`.

| Mnemonic | Aliases | Module | Symbol | What it does |
|---|---|---|---|---|
| `MON` | MONITOR, MARKETS, GLOBAL | monitor | none | Global markets monitor (6 regions, 18 symbols, 60s poll) |
| `Q` | QUOTE, DES | quote | required | Quote page: price + session stats (30s poll) |
| `GP` | CHART, G | chart | required | Chart: 8 ranges, crosshair, SMA50/200, volume, multi-symbol % compare |
| `N` | NEWS | news | optional | News feed w/ sentiment chips, entity tags, topic filters |
| `ECO` | CAL, CALENDAR | calendar | none | Economic release calendar |
| `FA` | FUND, FUNDAMENTALS, PROFILE | fundamentals | required | Profile + valuation/profitability metrics |
| `FS` | FIN, STATEMENTS, FINANCIALS | statements | required | Income/balance/cash-flow, ANNUAL/QTR toggle |
| `DIV` | DIVS, DIVIDEND, DIVIDENDS | dividends | required | Dividend history from SEC filings + TTM |
| `INS` | INSIDER, INSIDERS | insiders | required | Insider transactions (Form 4) |
| `AR` | RATINGS, ANALYST, RECS | ratings | required | Analyst recommendation trends + consensus bar |
| `ERN` | EARN, EARNINGS | earnings | optional | With symbol: surprise history. Without: market calendar |
| `IPO` | IPOS | ipo | none | IPO calendar |
| `HOLD` | HOLDERS, 13F, OWNERSHIP | holdings | required | Institutional holders — **no free source**, honest state |
| `SI` | SHORT, SHORTINT | short | required | Short interest — **no free source**, honest state |
| `SCR` | SCREEN, SCREENER | screener | none | Screener over 28-name large-cap universe, filters + sort |
| `RV` | PEERS, COMP, COMPARE | peers | optional | Peer compare, up to 6 symbols side-by-side |
| `HEAT` | SECTORS, HEATMAP | heatmap | none | Sector heatmap via SPDR sector ETFs (live, keyless) |
| `CORR` | CORREL, CORRELATION | correlation | none | Cross-asset correlation matrix (local Pearson, 6M returns) |
| `FX` | CURRENCY, CURRENCIES | fx | none | FX dashboard (14 pairs) |
| `RATES` | RATE, YIELDS, BONDS | rates | none | Treasury curve + bond ETFs |
| `CMDTY` | CMD, COMM, COMMODITIES | commodities | none | Energy/metals/ags/crypto |
| `W` | WL, WATCH, WATCHLIST | watchlist | none | Watchlists with live quotes |
| `ALRT` | ALERT, ALERTS | alerts | optional | Alerts center (notify-only) |
| `NOTE` | NOTES, NT | notes | optional | Research notes, optional symbol scoping |
| `LEARN` | TOUR, TUTORIAL, STUDENT | learn | none | Guided tour + mnemonic trainer + student-mode toggle |
| `GLOS` | GLOSSARY, DEFINE, DICT | glossary | optional | 48-term finance glossary w/ "see it" links |
| `HELP` | ?, H, CHEAT | help | none | Cheat sheet (generated from registry) |
| `SET` | SETTINGS, CONFIG, PREF | settings | none | Providers, API keys, usage/quota, health |

**Keyboard:** `/` or `Ctrl+K` focus command bar (or just start typing) · `↑↓`
select · `Enter` run · `Tab` complete · `Esc` close · `Alt+1…9` jump to tab ·
`Alt+PageUp/PageDown` cycle tabs · `Alt+W` close tab.

---

## 8. Honest gaps — do NOT fill these with fake data

These have no viable free source. The modules explain the limitation instead of
fabricating. Preserve this behavior.

| Gap | Why | Behavior |
|---|---|---|
| 13F / institutional holders | Requires aggregating every manager's quarterly 13F — paid-pipeline territory | `HOLD`: no default provider → honest 503 + explanation; demo shape only if explicitly forced in SET |
| Short interest / float | FINRA needs a registered OAuth account; vendors gate it behind paid plans | `SI`: same pattern as HOLD |
| Analyst price targets | Premium on Finnhub free | `AR` shows the ratings distribution + an explicit note that targets aren't available |
| Earnings call transcripts | No free API | Not implemented |
| Stock split history | No reliable free source (EDGAR tagging spotty) | `DIV` notes this |
| Options / implied volatility | No viable free API | Skipped, documented |
| AI daily digest | Needs a paid LLM key | Deferred — **ask the user before adding a paid provider** |

Deferred backup providers (deliberate, with rationale in DATA_PROVIDERS.md):
Alpaca IEX, Twelve Data, Marketstack (its free tier is 100 req/**month**).

---

## 9. API reference

All under `/api`. Market-data routes return an Envelope; domain routes return
plain JSON (local user data, not market data).

**Market data (envelope):**
`GET /health` · `GET /search?q=` · `GET /quotes?symbols=A,B` ·
`GET /series?symbol=&range=1D|5D|1M|6M|YTD|1Y|5Y|MAX` · `GET /news[?symbol=]` ·
`GET /calendar` · `GET /fundamentals?symbol=` ·
`GET /statements?symbol=&type=income|balance|cashflow&period=annual|quarterly` ·
`GET /screener` · `GET /insiders?symbol=` · `GET /ratings?symbol=` ·
`GET /earnings?symbol=` · `GET /dividends?symbol=` · `GET /holdings?symbol=` ·
`GET /short?symbol=` · `GET /earnings-calendar` · `GET /ipo-calendar`

**Config / meta:** `GET /settings` · `PUT /settings` · `GET /usage`

**Domain (plain JSON):**
`GET|POST /watchlists` · `DELETE /watchlists/:id` ·
`POST /watchlists/:id/items` · `DELETE /watchlists/:id/items/:symbol` ·
`GET|POST /notes` · `PUT|DELETE /notes/:id` ·
`GET|POST /alerts` · `POST /alerts/:id/dismiss` · `DELETE /alerts/:id` ·
`POST /alerts/evaluate` · `GET|PUT /workspace` · `GET|POST /commands/recent`

Unknown `/api/*` routes return a JSON 404 (never the SPA HTML), and a central
error handler returns JSON 500 without leaking stack traces.

---

## 10. Database (SQLite, `data/terminal.db`, schema v5)

Migrations are an **append-only array** in `server/db.ts`, versioned by
`meta.schema_version`. **Never edit or reorder a shipped migration — append a
new one.** WAL mode, `foreign_keys = ON`.

| # | Tables | Purpose |
|---|---|---|
| 001 | `settings`, `recent_commands` | Whitelisted config (with `key.*` masking) + command history |
| 002 | `cache` | Provider response cache (TTL) |
| 003 | `watchlists`, `watchlist_items`, `notes`, `alerts` | Persisted workspace objects. Alerts have status CHECK constraints; **no order/trade shape anywhere** |
| 004 | `ui_state` | Generic UI state, uncapped — currently the workspace layout |
| 005 | `request_log` (+ index) | Outbound request log for free-tier budgeting |

**Two key/value stores, kept separate on purpose:** `settings` is a whitelist
with secret masking and a 200-char cap (config + `learn.*` flags); `ui_state`
is uncapped generic UI state. Never route large blobs through `settings`.

Persisted: watchlists, alerts, notes, settings/API keys, recent commands,
workspace layout (open tabs + active tab), learning progress.

---

## 11. Secrets & configuration

- Real keys live in **`.env`** (gitignored) as `MKT_KEY_FINNHUB`,
  `MKT_KEY_MARKETAUX`, `MKT_KEY_FRED`, `MKT_KEY_ALPHAVANTAGE`, plus
  `MKT_EDGAR_CONTACT` (an email for SEC's fair-access User-Agent).
- Keys can also be entered in-app (`SET` → API KEYS) and are stored in the
  SQLite `settings` table. **A value saved in SET wins over `.env`.**
- Resolution happens in `server/settings.ts` → `getSetting()`: settings table
  first, then `process.env['MKT_KEY_' + NAME]`. There are **no hardcoded
  fallback secrets** anywhere in the code — keep it that way.
- `.env` is loaded by `node --env-file-if-exists=.env` in the npm scripts.
- **`.env.example` must only ever contain empty placeholders.**

A full pre-publish security audit was completed 2026-09-06: gitleaks scanned
all commits (no leaks), git history was rewritten with `git-filter-repo` to
purge a hardcoded contact email and replace commit author identities with a
GitHub noreply address, and demo data was changed to fictional names so
synthetic transactions never reference real people or firms.

---

## 12. Gotchas that have already cost time

Read this section before debugging anything — most of these were discovered the
hard way.

1. **PowerShell execution policy is `Restricted`** — `.ps1` files won't run.
   Use the `.cmd` wrappers.
2. **Keep `.ps1` files ASCII-only with no backtick line-continuations.**
   Windows PowerShell 5.1 failed to parse a backtick-continued `Start-Process`
   in `run.ps1` ("Unexpected token '}'"). Assign the command to a variable and
   call it on one line. Verify with
   `[System.Management.Automation.Language.Parser]::ParseFile(path,[ref]$t,[ref]$e)`.
3. **Multiline `git commit -m` here-strings break in this PowerShell.** Write
   the message to a file and use `git commit -F <file>`.
4. **Server process ownership** — see §3. A server started by an AI's tool
   shell dies with that session.
5. **A stale Vite dev server on :5173 will confuse you.** It proxies `/api` to
   :4780; if 4780 is dead the page renders but every panel fails.
6. **EDGAR XBRL tag transitions.** Companies switch tags across filing years
   (Apple: `Revenues` → `RevenueFromContractWithCustomerExcludingAssessedTax`).
   A single tag rarely covers every period, so `edgar.ts` merges across
   candidate tags per end-date. This bug silently produced null Revenue.
7. **Clear the cache after fixing a provider bug.** Statements cache for 7
   days, so a fixed adapter keeps serving the old broken payload. Delete rows
   from the `cache` table (e.g. `DELETE FROM cache WHERE key LIKE 'statements:%'`).
8. **FRED's first call after boot can exceed the 10s fetch timeout.** A retry
   succeeds and the 6h cache absorbs it. Not a bug.
9. **Node server imports need explicit `.ts` extensions** (native TS execution),
   and `erasableSyntaxOnly` is enforced: **no enums, no namespaces, no
   constructor parameter properties**. The client imports `shared/` via
   relative paths *without* extensions (Vite).
10. **Biome formatting is enforced** (single quotes, 2-space, 100 cols). Run
    `npm run lint:fix` before committing; it will reflow long lines and can
    change line numbers.
11. **Deep links vs saved layout.** On boot, the saved workspace layout is
    restored; a URL-hash deep link to a view *not* in that layout is appended
    and activated (this was a fix — don't regress it).
12. **Demo data must use fictional names** (people and institutions). This was
    a security-audit fix; don't reintroduce real names.

---

## 13. Verification playbook

The project standard is: **verify by observing real behavior, not by assuming.**
After changes run:

```powershell
npm run typecheck    # must exit 0
npm run lint         # must exit 0
npm run build        # must succeed
```

Then exercise the actual paths. Useful one-liners:

```powershell
# health + schema
Invoke-RestMethod http://localhost:4780/api/health

# provider readiness (are keys loading?)
(Invoke-RestMethod http://localhost:4780/api/settings).providers |
  ForEach-Object { "{0,-13} ready={1}" -f $_.id, $_.ready }

# live quote sanity
Invoke-RestMethod "http://localhost:4780/api/quotes?symbols=AAPL,^DJI"

# official filings path (keyless)
(Invoke-RestMethod "http://localhost:4780/api/statements?symbol=AAPL&type=income&period=annual").data.periods

# free-tier usage + websocket status
Invoke-RestMethod http://localhost:4780/api/usage
```

For UI verification, drive the app in a browser and inspect the DOM (the
browser-pane screenshot tool has been flaky on this machine; DOM/JS inspection
is the reliable path).

---

## 14. Build history

Built across multiple sessions in explicit phases. Full detail in
`docs/SESSION_LOG.md` (newest first) and `docs/ROADMAP.md`.

| Phase | Delivered |
|---|---|
| 0 | Foundation: stack, scaffold, SQLite, lint/typecheck, PS scripts, docs |
| 1 | App shell: command bar + mnemonic registry + parser, tabs, routing, shortcuts, placeholder modules |
| 2 | Data layer: provider abstraction, envelope, TTL cache, demo + yahoo, live monitor/quote/chart/news/calendar, settings |
| 3 | Core modules: watchlists, notes, alerts + notify-only alert engine (migration 003) |
| 4 | Analytics: screener, peer compare, fundamentals, statements, FX/RATES/CMDTY dashboards; finnhub + alphavantage adapters |
| 5 | Learning: glossary, guided tour, parser-graded mnemonic trainer, student mode, onboarding |
| 6 | Polish: layout persistence (004), notifications, CSV export, error boundary, JSON 404, README |
| 7 | Advanced charting: crosshair/OHLCV tooltip, SMA overlays, volume subpanel, multi-symbol % comparison |
| 8 | Data expansion: SEC EDGAR, finnhub research endpoints + websocket, marketaux, FRED, request budgeting (005), freshness tiers, 9 new modules |
| — | Security audit + first push to GitHub (private) |

---

## 15. Backlog (nothing is in progress)

From `docs/ROADMAP.md`:

- Alpaca IEX + Twelve Data backup adapters (deferred with rationale)
- AI daily digest per watchlist — **needs a paid LLM key; ask the user first**
- Drag-to-reorder tabs; split-pane workspaces
- More screener metrics + saved screens; watchlist CSV import
- Real intraday options/IV if a free source ever appears

Working style the owner expects: work in phases, don't redesign between
sessions, inspect the repo before coding, prefer incremental working
checkpoints, run checks after changes, update `SESSION_LOG.md` + `ROADMAP.md`,
and end a session with what was completed / what remains / the exact PowerShell
command for next time.

---

## 16. Checklist for the receiving AI

1. Read `CLAUDE.md`, then `docs/ARCHITECTURE.md`, then `docs/ROADMAP.md` and
   the newest entry of `docs/SESSION_LOG.md`.
2. Inspect actual repo state (`git log --oneline`, `git status`) before
   assuming anything from this document.
3. Never add trading/execution capability. Never fabricate data. Never claim a
   feed is fresher than it is.
4. Never commit `.env`, real keys, personal emails, or absolute paths
   containing the user's Windows username.
5. Use the `.cmd` wrappers on Windows; keep `.ps1` ASCII and backtick-free.
6. Extend the provider abstraction and the command registry rather than
   bypassing them.
7. Append DB migrations; never edit shipped ones.
8. Run typecheck + lint + build, then verify real behavior, before claiming
   something works.
9. Update the docs and commit with a descriptive message (`git commit -F` for
   long messages).
