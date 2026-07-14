# Session log

Append one entry per Claude Code session. Newest at the top.

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
