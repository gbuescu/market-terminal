# Data providers

Rules (from CLAUDE.md): affordable/public sources first; document every
source and its limitations here; label delayed vs near-real-time in the UI;
never imply anything is official Bloomberg data; keep all provider logic in
`server/providers/` behind adapter interfaces.

## Status

Phase 2 shipped two providers behind the adapter boundary
(`server/providers/`):

| Provider | Capabilities | Key | Latency label | Notes |
|---|---|---|---|---|
| `demo` | search, quotes, series, news, calendar, fundamentals, statements | none | synthetic (~rt) | Deterministic seeded walk; **every payload flagged `demo: true`** and badged "DEMO DATA" in the UI |
| `yahoo` | search, quotes, series, news (per-symbol only) | none | labeled DELAYED (≤15 min, exchange-dependent) | **Unofficial** endpoints (`query1.finance.yahoo.com` v8 chart / v1 search). Undocumented; may break or rate-limit at any time. Browser-like User-Agent required. |
| `finnhub` | quotes, fundamentals | required (free) | near-real-time (US) | Free tier 60 req/min. Activates when `key.finnhub` saved in SET. Fundamentals via /stock/metric + /stock/profile2. Lightly tested (no key on dev machine) — verify on first live use. |
| `alphavantage` | fundamentals, statements | required (free) | EOD/daily | Free tier only **25 req/DAY** → statements cached 7 days, fundamentals 24 h. Activates when `key.alphavantage` saved in SET. Lightly tested (no key on dev machine) — verify on first live use. |

Selection: per-capability priority (yahoo → demo; calendar demo-only), user
override via `provider.<capability>` setting ('auto' or provider id; a forced
provider is exclusive). Fall-through between providers happens only on
`Unsupported` (capability shape), never on network failure — live failures
surface as errors/stale cache instead of silently becoming demo data.

Caching (server/cache.ts): search 24h · quotes 30s · series 15m (1D: 5m) ·
news 5m · calendar 6h; stale entries are served with `stale: true` when a
refresh fails.

## Candidates (future phases)

| Source | Data | Cost | Key needed | Latency | Notes |
|---|---|---|---|---|---|
| Stooq (CSV endpoints) | EOD + some intraday OHLC, indices, FX | Free | No | EOD/delayed | Very simple CSV; good default for charts with zero keys |
| Yahoo Finance (unofficial endpoints) | Quotes, charts, fundamentals | Free | No | ~Real-time to 15m delayed | Unofficial/undocumented; can break; rate-limit politely |
| Alpha Vantage | Quotes, daily series, FX, fundamentals | Free tier | Yes | Delayed; 25 req/day free | Tiny free quota — cache aggressively |
| Finnhub | Quotes, news, fundamentals, calendar | Free tier | Yes | Near-real-time (US) | 60 req/min free; good news + earnings calendar |
| FRED (St. Louis Fed) | US macro/economic series | Free | Yes (free) | Daily | Official; excellent for economics module |
| ECB Data Portal / SDMX | EU rates, FX reference | Free | No | Daily | Official reference rates |
| CoinGecko | Crypto quotes/series | Free tier | No | Near-real-time | Generous free tier |
| Frankfurter.app | FX daily reference rates | Free | No | Daily | Simple, keyless FX fallback |
| Demo/seed provider | Everything | — | No | Static | **Ships first.** Clearly labeled "DEMO DATA" in UI; guarantees app works with zero keys |

## Decisions log

- 2026-07-14 (Phase 2): shipped `demo` + `yahoo` adapters. Yahoo chosen as
  the first live source because it is keyless (zero-setup live data), covers
  4 of 5 capabilities, and uses familiar symbol conventions (AAPL, ^GSPC,
  EURUSD=X, GC=F). Risk accepted: unofficial API. Mitigations: stale-serve
  cache, demo fallback selectable in SET, honest DELAYED labeling.
- 2026-07-14: calendar stays demo-only until a proper economics source
  (FRED key slot already exists) lands in Phase 4.
- 2026-07-14: API keys stored plaintext in local SQLite (`data\terminal.db`,
  gitignored) — acceptable for a single-user local app; revisit if that
  assumption changes.
- 2026-07-14 (Phase 4): fundamentals/statements deliberately NOT scraped
  from Yahoo — its quoteSummary endpoints are crumb/cookie-gated and
  fragile. Instead: key-gated finnhub + alphavantage adapters (free tiers),
  demo provider as the zero-key default. Capability orders:
  fundamentals = finnhub → alphavantage → demo; statements = alphavantage →
  demo. Screener evaluates a fixed 28-name large-cap universe
  (SCREEN_UNIVERSE in server/routes.ts) through the fundamentals provider,
  cached 24 h.
