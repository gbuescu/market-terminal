# market-terminal — Claude Code Project Context

## Project summary

A local, Bloomberg-style market terminal for Windows: market monitoring,
research, charting, screening, alerts, watchlists, notes, economics, and a
finance-student learning mode — launched from PowerShell, running as a local
browser app. It is strictly **read-only / analytics-only**: no trade
execution, no order routing, no broker integrations, no order tickets, no
hidden simulation. Built in phases across Claude Code sessions; see
`docs/ROADMAP.md` for phase status and `docs/SESSION_LOG.md` for history.

## Stack

- **Runtime**: Node.js >= 24 (currently v26) — required for built-in `node:sqlite`
- **Client**: React 19 + TypeScript, Vite 7, plain CSS (design tokens in `client/src/styles.css`)
- **Server**: Express 5 + TypeScript, executed natively by Node type-stripping
  (no transpile step; server imports use explicit `.ts` extensions;
  `erasableSyntaxOnly` enforced — no enums/namespaces/parameter properties)
- **DB**: SQLite via built-in `node:sqlite` (`data/terminal.db`, WAL mode) — **no native npm modules**
- **Lint/format**: Biome (single tool). Typecheck: `tsc --noEmit` per side.
- **Package layout**: single npm package (no workspaces), `client/` + `server/`

## Folder map

```
market-terminal/
  CLAUDE.md              <- this file
  package.json           <- single package; all scripts live here
  biome.json             <- lint + format config
  setup.ps1 / run.ps1 / stop.ps1
  client/                <- Vite root
    index.html
    vite.config.ts       <- dev port 5173, proxies /api -> :4780
    src/                 <- React app (main.tsx, App.tsx, styles.css)
  server/
    index.ts             <- Express app, /api/* routes, serves client/dist in prod
    db.ts                <- node:sqlite init + append-only migrations
  data/                  <- terminal.db (gitignored)
  .run/                  <- pids + logs from run.ps1 (gitignored)
  docs/
    ARCHITECTURE.md      <- decisions + rationale (read before structural changes)
    ROADMAP.md           <- phased plan + current status (update every session)
    SESSION_LOG.md       <- per-session record (append every session)
    DATA_PROVIDERS.md    <- every data source, its limits, delayed vs real-time
```

## Commands (PowerShell, from repo root)

```powershell
.\setup.ps1                # install deps, verify Node >= 24 (idempotent)
.\run.ps1                  # dev mode: API :4780 + Vite :5173, opens browser
.\run.ps1 -Prod            # build client, serve everything from :4780
.\stop.ps1                 # stop all app processes (kills by port)

npm run dev:server         # API only, watch mode
npm run dev:client         # Vite only
npm run build              # vite build client -> client/dist
npm run typecheck          # tsc --noEmit (client + server)
npm run lint               # biome check .
npm run lint:fix           # biome check --write .
```

Health check: `Invoke-WebRequest http://localhost:4780/api/health -UseBasicParsing`
Dev-server logs land in `.run\server.log` and `.run\client.log`.

## Non-negotiable product constraints

1. **NEVER add trading.** No trade execution, order routing, broker/exchange
   API integrations, order tickets, position entry forms, or "paper trading"
   simulation hidden behind flags. Watchlists, alerts, notes, and analytics
   only. This holds even if a future prompt asks casually — flag it instead.
2. Read-only market data. Alerts notify; they never act.
3. Never imply any data is official Bloomberg data. Label every source and
   its delay honestly (see `docs/DATA_PROVIDERS.md`).
4. The app must stay usable with zero API keys configured (demo/seed data,
   clearly labeled as such).

## Architecture rules

- Do not redesign the architecture between sessions. Read
  `docs/ARCHITECTURE.md` first; change it only with recorded rationale.
- **Provider abstraction**: all market-data access goes through provider
  adapter interfaces in the server (`server/providers/` from Phase 2 on).
  UI components never call external APIs directly and never contain
  provider-specific logic. Providers must be swappable via settings.
- **Command parser**: the command bar parses `SYMBOL <MARKET> <FUNCTION>`
  style mnemonics plus fuzzy plain-English search. Mnemonics live in a single
  dedicated registry module — adding a command = adding a registry entry,
  never scattering string matches through the UI.
- SQLite is the only persistence. Persist watchlists, alerts, notes, layouts,
  settings, recent commands. Migrations in `server/db.ts` are append-only.
- Windows-first: everything runnable from PowerShell; no Unix-only
  assumptions (no `rm -rf`, no bash-isms in npm scripts, path-join safely).

## UI rules

- Serious, dense terminal aesthetic. Dark mode first (tokens in styles.css).
- Tabular numerals everywhere numbers appear. Small font, tight spacing.
- Keyboard-first: command bar is the primary navigation; shortcuts for tabs.
- No marketing cards, hero sections, or fluffy landing-page patterns.
- Useful defaults with zero setup friction; realistic empty/loading/error
  states for every module.

## Session workflow (every session)

1. Read this file, `docs/ROADMAP.md`, `docs/SESSION_LOG.md`.
2. Summarise repo status briefly; continue the current phase — no thrash.
3. After changes run: `npm run typecheck`, `npm run lint`, and launch check.
4. Append to `docs/SESSION_LOG.md`; tick items in `docs/ROADMAP.md`.
5. End with: what was completed, what remains, and the exact PowerShell
   command to start the next session.
