# Data providers

Rules (from CLAUDE.md): affordable/public sources first; document every
source and its limitations here; label delayed vs near-real-time in the UI;
never imply anything is official Bloomberg data; keep all provider logic in
`server/providers/` behind adapter interfaces.

## Status

Phase 2 not started. No providers integrated yet. The scaffold has no
external data access. This table is the candidate list to evaluate when
Phase 2 begins.

## Candidates (to evaluate in Phase 2)

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

- 2026-07-14: none yet — table above is candidates only, no commitments.
