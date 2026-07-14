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

## Phase 3 — Core modules (CURRENT)

- [ ] Global markets monitor
- [ ] Quote page · chart page · news page · economic calendar
- [ ] Watchlists · notes · alerts center (persisted in SQLite)

## Phase 4 — Analytics modules

- [ ] Equity screener · relative value · peer compare
- [ ] Company fundamentals · financial statements
- [ ] Rates / FX / commodities dashboards

## Phase 5 — Learning workflow

- [ ] Command cheat sheet · finance glossary
- [ ] Student mode · onboarding/tutorial panel
- [ ] Command examples + mnemonic training

## Phase 6 — Polish

- [ ] Layout persistence · notifications · CSV export
- [ ] Better error handling, demos, screenshots
- [ ] README hardening · launch reliability improvements
