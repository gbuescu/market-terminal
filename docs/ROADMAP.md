# Roadmap

Work strictly in phase order; only touch later-phase items when fixing a
shared blocker. Tick items as they land; note the session date.

## Phase 0 — Foundation ✅ (2026-07-14)

- [x] Choose stack (React+TS+Vite / Express+TS / node:sqlite / Biome)
- [x] Scaffold project (single package, client/ + server/)
- [x] Package manager set up (npm)
- [x] Linting, formatting (Biome), typing (tsc strict, both sides)
- [x] SQLite set up with append-only migration mechanism
- [x] setup.ps1, run.ps1 (+ -Prod), stop.ps1
- [x] README, CLAUDE.md, docs/ (ARCHITECTURE, ROADMAP, SESSION_LOG, DATA_PROVIDERS)
- [x] App launches locally (verified: health endpoint + rendered page)

## Phase 1 — App shell ✅ (2026-07-14)

- [x] Terminal shell layout: sidebar, top command bar, tab workspace, status bar
- [x] Client-side routing wired to tabs (hash sync, back/forward, deep links)
- [x] Dark theme finalized (tokens in styles.css)
- [x] Keyboard shortcuts (/, Ctrl+K, type-to-command, Alt+1–9, Alt+PgUp/PgDn, Alt+W)
- [x] Command parser v0 + mnemonic registry module (10 commands, fuzzy search)
- [x] Placeholder modules with realistic empty/loading/error states
      (monitor, quote, chart, news, calendar, watchlist, alerts, notes, settings, help)
- [x] Bonus: recent-command history persisted via API into SQLite

## Phase 2 — Data layer ✅ (2026-07-14)

- [x] Provider adapter interfaces (`server/providers/`): demo + yahoo shipped;
      fall-through between providers ONLY on Unsupported (never silent demo)
- [x] Symbol search (API + command-bar integration); quotes; chart time series
      (SVG chart with ranges); news feed; macro calendar (demo-only for now)
- [x] Caching: SQLite TTL cache + in-flight dedup + stale-serve on fetch failure
- [x] Stale/delayed-data indicators end to end (envelope → DataBadge chips:
      SOURCE / time / DEMO / DELAYED / CACHED / STALE)
- [x] Settings page: provider status, per-capability provider selection,
      API key storage (finnhub/alphavantage/fred slots for future adapters);
      zero-key usage works (yahoo keyless; demo offline)

## Phase 3 — Core modules ✅ (2026-07-14)

- [x] Global markets monitor (live since Phase 2)
- [x] Quote page (+ GP/N/ALRT cross-nav) · chart page · news page ·
      economic calendar (live since Phase 2)
- [x] Watchlists: multiple named lists, live-quoted rows, symbol → quote
      cross-nav (migration 003)
- [x] Notes: list + editor, optional symbol scoping ("NVDA NOTE")
- [x] Alerts center: above/below level alerts, server engine evaluates every
      60s through the provider registry (notify-only), triggered/active
      sections, status-bar "⚠ N ALERTS TRIGGERED" flag, "AAPL ALRT" prefill

## Phase 4 — Analytics modules ✅ (2026-07-14)

- [x] Equity screener (SCR): 28-name large-cap universe, client-side filters
      (min mkt cap / max P/E / min div yield) + sortable columns
- [x] Relative value / peer compare (RV): up to 6 symbols side-by-side,
      "AAPL RV" seeds a comparison
- [x] Company fundamentals (FA): profile + valuation/profitability metrics
- [x] Financial statements (FS): income/balance/cashflow, 4 annual periods,
      normalized line items
- [x] Rates / FX / commodities dashboards (RATES, FX, CMDTY): shared
      QuoteBoard over live keyless yahoo quotes (Treasury curve, 14 FX pairs,
      energy/metals/ags/crypto)
- [x] Providers: finnhub (fundamentals+quotes) and alphavantage
      (statements+fundamentals) adapters, key-gated via SET; demo covers
      everything with zero keys. New capabilities: fundamentals, statements.

## Phase 5 — Learning workflow ✅ (2026-07-15)

- [x] Command cheat sheet (HELP, auto-generated from registry since Phase 1)
- [x] Finance glossary (GLOS): 48 curated terms in 6 categories, search +
      category filters, "see it" links run real commands; "BETA GLOS"
      deep-links a filtered view
- [x] Student mode: explainer strip on every module (config/explainers.ts),
      STUDENT topbar tag, toggle in LEARN, persisted (learn.studentmode)
- [x] Onboarding/tutorial: first-run banner → LEARN 9-step guided tour with
      TRY IT buttons executing real commands; progress persisted
- [x] Mnemonic training: trainer quiz graded by the real parser (aliases
      count), streak + persisted best streak

## Phase 6 — Polish ✅ (2026-07-15)

- [x] Layout persistence: open tabs + active tab saved to ui_state
      (migration 004) via GET/PUT /api/workspace, restored on boot
      (hash deep-link still wins for active tab)
- [x] Notifications: browser Notification API; StatusBar fires on newly
      triggered alerts (seeded silently on first poll); opt-in button in ALRT
- [x] CSV export: shared toCsv/downloadCsv + ExportButton on screener,
      watchlist, statements, calendar, and FX/RATES/CMDTY boards
- [x] Better error handling: per-module React ErrorBoundary; server JSON 404
      + central error middleware for /api (no HTML leak to API callers)
- [x] Screenshots: documented capture guidance in README (dark dense UI;
      binary shots are a manual step)
- [x] README hardening: full command table, shortcuts, data-honesty,
      persistence, troubleshooting, reset instructions
- [x] Launch reliability: run.ps1 now waits for an actual /api/health 200
      before opening the browser

**All six build phases complete.** Remaining ideas are enhancements beyond
the original plan; they get their own numbered phases as they land.

## Phase 7 — Advanced charting ✅ (2026-07-16, post-v1 enhancement)

Extends the existing GP module; no architectural change, no new server code
(reuses `/api/series`), still read-only.

- [x] Interactive crosshair with hover tooltip — OHLCV in price mode,
      per-symbol % in comparison mode
- [x] Moving-average overlays: SMA50 / SMA200 toggles (client-side from
      candle closes, `lib/indicators.ts`), dashed with a legend
- [x] Volume subpanel (VOL toggle) when the series carries volume
- [x] Multi-symbol comparison: overlay up to 4 extra symbols as normalized
      % lines on a shared % axis (forces percent mode), legend with per-
      symbol return and remove control
- [x] Bonus fix: deep-link to a view not in the saved layout now opens that
      view (previously the saved active tab silently won)

## Phase 8 — Data expansion ✅ (2026-07-16, post-v1 enhancement)

- [x] SEC EDGAR adapter (keyless, official): statements annual+quarterly
      (multi-tag XBRL merge) + dividend history — now the statements default;
      live-verified against Apple 10-K/10-Q
- [x] Finnhub expansion: insiders, ratings, earnings+surprises, earnings
      calendar, IPO calendar, websocket live trades (smart LRU subscriptions,
      backoff reconnect) — key-gated, untested until a key is added
- [x] marketaux (news + entity sentiment) and FRED (official US release
      calendar) adapters — key-gated
- [x] Request budgeting: request_log (migration 005) + per-provider budgets
      under free-tier limits, stale-cache degradation, SET usage panel
- [x] Freshness tiers end to end (REALTIME/NEAR-RT/DELAYED/EOD/OFFICIAL/
      DEMO) — REALTIME only ever from the ws feed
- [x] 9 new modules: INS, AR, ERN, IPO, DIV, HOLD, SI, HEAT (live sector
      ETFs), CORR (live local correlation matrix)
- [x] News: sentiment chips (article + entity), topic filters, snippets
- [x] FS: ANNUAL/QTR toggle · .env.example + MKT_KEY_* env fallback ·
      README key guide
- [x] Honest gaps documented: 13F/short interest/transcripts/price targets/
      splits/options IV have no free source — modules say so, never fake

## Enhancement backlog (unstarted)

- Alpaca IEX + Twelve Data backup adapters (deferred from Phase 8 — see
  DATA_PROVIDERS decisions log)
- AI daily digest per watchlist (needs a paid LLM key — ask first)
- Drag-to-reorder tabs; split-pane workspaces
- More screener metrics + saved screens; watchlist CSV import
