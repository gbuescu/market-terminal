# Session log

Append one entry per Claude Code session. Newest at the top.

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
