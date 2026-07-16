# Data providers

Rules (from CLAUDE.md): affordable/public sources first; document every
source and its limitations here; label freshness honestly in the UI (never
claim real-time unless it is); never imply anything is official Bloomberg
data; keep all provider logic in `server/providers/` behind adapter
interfaces.

## Active providers (Phase 8)

| Provider | Capabilities | Key | Freshness label | Budget (vs published limit) | Notes |
|---|---|---|---|---|---|
| `yahoo` | search, quotes, series, news (per-symbol) | none | DELAYED (≤15 min) | 60/min (self-imposed politeness) | **Unofficial** endpoints; may break or rate-limit. Covers indices/FX/futures/global — the keyless quotes default. |
| `edgar` | statements (annual 10-K + quarterly 10-Q), dividends | none | OFFICIAL | 240/min (SEC fair-access is 10/sec) | SEC XBRL companyfacts. As-filed data, US filers only; multi-tag merge handles tag transitions. Descriptive User-Agent sent as SEC requires. **Live-verified.** |
| `finnhub` | quotes (+**websocket live trades** = only true REALTIME), fundamentals, insiders, ratings, earnings, earnings calendar, IPO calendar | free key | NEAR-RT (REALTIME via ws) | 50/min (limit 60/min) | US-focused. WS: smart LRU subscriptions from on-screen symbols, cap 40, idle unsub 2 min, backoff reconnect. Price targets + short interest are premium — not offered. *Untested until a key is added.* |
| `marketaux` | news (entity tagging + sentiment) | free key | NEAR-RT | 10/min, 90/day (limit 100/day, 3 articles/resp) | Sentiment per entity −1..1. Cached hard (news TTL 5 min) to live inside the tiny quota. *Untested until a key is added.* |
| `fred` | calendar (US release schedule) | free key | OFFICIAL | 60/min | fred/releases/dates, importance-ranked majors (CPI/NFP/GDP/FOMC=high). US only. *Untested until a key is added.* |
| `alphavantage` | fundamentals, statements (annual + quarterly) | free key | EOD | 4/min, 20/day (limit 5/min, 25/day) | Non-US statements backup behind EDGAR. |
| `demo` | everything | none | DEMO DATA | — | Deterministic synthetic; every payload flagged `demo: true`. |

## Selection & fallback logic

- Per-capability priority order (first `ready()` provider wins); user can
  force a provider per capability in SET ('auto' or id; forced = exclusive).
- Orders: quotes `yahoo→finnhub→demo` (yahoo first because finnhub free has
  no indices/FX/futures; force finnhub in SET for near-RT US equities + ws) ·
  news `marketaux→yahoo→demo` · calendar `fred→demo` · statements
  `edgar→alphavantage→demo` · dividends `edgar→demo` · fundamentals
  `finnhub→alphavantage→demo` · insiders/ratings/earnings/erncal/ipo
  `finnhub→demo` · **holdings/short: NO default** (see below).
- Fall-through happens only on `Unsupported` (capability shape) — never on
  network failure. Live failures serve flagged stale cache or surface as
  errors; demo is never silently substituted.
- **Request budgeting** (`server/budget.ts`, `request_log` table): every
  outbound call is recorded and checked against the budgets above (set
  BELOW published limits — safeguards, not ToS workarounds). Exhausted
  budget → stale cache if available, else a clear error. SET shows live
  usage per provider (last min/hour/day + remaining).

## Freshness tiers (Envelope.freshness → DataBadge)

REALTIME (ws trades only; cache hits demoted to NEAR-RT) · NEAR-RT ·
DELAYED · EOD · OFFICIAL (regulatory source, filing cadence) · DEMO DATA.

## Honest gaps (no free source — modules say so instead of faking)

- **13F/institutional holders per symbol**: requires aggregating every
  manager's quarterly 13F — paid-pipeline territory. HOLD module explains
  this; demo shape available only if explicitly forced in SET.
- **Short interest/float**: FINRA data needs a registered OAuth API account;
  vendors gate it behind paid plans. SI module explains; demo-only if forced.
- **Earnings call transcripts**: no free API (Finnhub's is premium). Skipped.
- **Analyst price targets**: premium on Finnhub free; ratings distribution
  shown instead, with an explicit note.
- **Stock split history**: no reliable free source (EDGAR tagging is spotty);
  DIV module notes this.
- **Options/implied volatility**: no viable free API (CBOE has no free API).
  Skipped cleanly per plan.

## Deferred backup providers (deliberate scope call, 2026-07-16)

- **Alpaca IEX** (free key pair): real-time IEX quotes+ws. Deferred — finnhub
  already provides the keyed near-RT/ws path; a second untestable ws adapter
  added risk without new capability. Next candidate if finnhub disappoints.
- **Twelve Data** (free 800 credits/day): multi-asset backup. Deferred —
  yahoo already covers multi-asset keyless.
- **Marketstack** (free **100 req/MONTH**): EOD backfill. Deferred — quota is
  too small to matter; yahoo/EDGAR cover history.
- **AI daily digest**: needs a paid LLM API key — out of free-only scope;
  ask before adding.

## Caching TTLs

search 24h · quotes 30s · series 15m (1D: 5m) · news 5m · calendar 6h ·
fundamentals 24h · statements 7d annual / 1d quarterly · dividends 24h ·
insiders 6h · ratings/earnings 24h · erncal/ipo 6h · EDGAR companyfacts 6h ·
EDGAR ticker→CIK map 24h. Stale entries served with `stale: true` when a
refresh fails.

## Decisions log

- 2026-07-14 (Phase 2): shipped `demo` + `yahoo`. Yahoo: keyless zero-setup
  live data, familiar symbols; risk of unofficial API accepted with
  stale-serve + honest DELAYED labeling.
- 2026-07-14: API keys stored plaintext in local SQLite (single-user local
  app). Phase 8 adds MKT_KEY_* env fallback via .env (node
  --env-file-if-exists); SET value wins.
- 2026-07-14 (Phase 4): fundamentals/statements NOT scraped from Yahoo
  (crumb-gated). Key-gated finnhub + alphavantage instead.
- 2026-07-16 (Phase 8): **SEC EDGAR promoted to statements/dividends
  default** — official, keyless, unlimited; live-verified against Apple
  10-K/10-Q filings. Added marketaux (sentiment news), FRED (release
  calendar), finnhub research endpoints + websocket, request budgeting +
  usage panel, freshness tiers. holdings/short ship with NO default
  provider — honest 503 rather than fake data. Backups (Alpaca, Twelve
  Data, Marketstack) deferred with rationale above.
